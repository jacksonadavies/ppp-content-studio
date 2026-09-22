import io
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

import auth as authlib
import ai_layup
import exporters
import poker_render

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ppp")

COACHES = [
    {"id": "alex-vance", "name": "Alex 'GTO' Vance", "role": "Lead Theory & Cash Game Coach",
     "email": "alex@practicalpokerplus.com", "password": "coach1234",
     "avatar": "/brand/avatars/spencer.png"},
    {"id": "elena-rostova", "name": "Elena 'Range' Rostova", "role": "MTT Tournament Strategy Specialist",
     "email": "elena@practicalpokerplus.com", "password": "coach1234",
     "avatar": "/brand/avatars/will.png"},
    {"id": "marcus-brody", "name": "Marcus 'The Solver' Brody", "role": "Exploitative & Live Poker Coach",
     "email": "marcus@practicalpokerplus.com", "password": "coach1234",
     "avatar": "/brand/avatars/austin.png"},
    {"id": "david-chen", "name": "David 'Nuts' Chen", "role": "High Stakes Mindset & Math Coach",
     "email": "david@practicalpokerplus.com", "password": "coach1234",
     "avatar": "/brand/avatars/carson.png"},
]


# ---------- Models ----------
class LoginBody(BaseModel):
    email: str
    password: str


class GenerateBody(BaseModel):
    coach_id: str
    title: Optional[str] = ""
    raw_text: str


class LayoutPatch(BaseModel):
    layout: str


class DeckPatch(BaseModel):
    title: Optional[str] = None
    slides: Optional[List[dict]] = None


class ReplayBody(BaseModel):
    coach_id: str
    title: str
    config: dict


class ExportMedia(BaseModel):
    fmt: str = "gif"
    fps: int = 2
    frames: List[dict]
    deck: Optional[str] = "fourcolour"
    title: Optional[str] = "ppp-replay"


# ---------- Auth dependency ----------
async def current_user(request: Request):
    return await authlib.get_current_user_from(request, db)


def _now():
    return datetime.now(timezone.utc).isoformat()


# ---------- Auth routes ----------
@api_router.post("/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not authlib.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    token = authlib.create_access_token(uid, email)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none",
                        max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "email": email, "name": user.get("name"),
                                     "role": user.get("role"), "coach_id": user.get("coach_id"),
                                     "avatar": user.get("avatar")}}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


@api_router.get("/coaches")
async def coaches():
    return [{"id": c["id"], "name": c["name"], "role": c["role"], "avatar": c["avatar"],
             "email": c["email"]} for c in COACHES]


# ---------- Helpers ----------
def _slide_ids(slides):
    for s in slides:
        s.setdefault("id", str(uuid.uuid4()))
    return slides


async def _get_deck(deck_id):
    deck = await db.decks.find_one({"id": deck_id}, {"_id": 0})
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


def _extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".txt") or name.endswith(".md"):
        return data.decode("utf-8", errors="ignore")
    if name.endswith(".docx"):
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    if name.endswith(".pptx"):
        from pptx import Presentation
        prs = Presentation(io.BytesIO(data))
        lines = []
        for slide in prs.slides:
            for shp in slide.shapes:
                if shp.has_text_frame:
                    for para in shp.text_frame.paragraphs:
                        t = "".join(r.text for r in para.runs).strip()
                        if t:
                            lines.append(t)
        return "\n".join(lines)
    raise HTTPException(status_code=400, detail="Unsupported file type. Use .pptx, .docx, .txt")


# ---------- Deck routes ----------
@api_router.get("/decks")
async def list_decks(coach_id: Optional[str] = None, user: dict = Depends(current_user)):
    match = {}
    if coach_id:
        match["coach_id"] = coach_id
    pipeline = [
        {"$match": match},
        {"$project": {"_id": 0, "id": 1, "coach_id": 1, "title": 1, "source": 1,
                      "created_at": 1, "updated_at": 1,
                      "slides_count": {"$size": {"$ifNull": ["$slides", []]}}}},
        {"$sort": {"updated_at": -1}},
    ]
    return await db.decks.aggregate(pipeline).to_list(500)


@api_router.get("/decks/{deck_id}")
async def get_deck(deck_id: str, user: dict = Depends(current_user)):
    return await _get_deck(deck_id)


@api_router.post("/decks/generate")
async def generate_deck(body: GenerateBody, user: dict = Depends(current_user)):
    if not body.raw_text.strip():
        raise HTTPException(status_code=400, detail="Please provide lecture content")
    result = await ai_layup.generate_deck(body.raw_text, body.title or "")
    deck = {
        "id": str(uuid.uuid4()),
        "coach_id": body.coach_id,
        "title": body.title or result.get("deckTitle") or "Untitled Lecture",
        "slides": _slide_ids(result["slides"]),
        "source": "paste",
        "created_at": _now(),
        "updated_at": _now(),
    }
    await db.decks.insert_one(dict(deck))
    deck.pop("_id", None)
    return deck


@api_router.post("/decks/upload")
async def upload_deck(coach_id: str = Form(...), title: str = Form(""),
                      file: UploadFile = File(...), user: dict = Depends(current_user)):
    data = await file.read()
    text = _extract_text(file.filename, data)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in the file")
    result = await ai_layup.generate_deck(text, title or file.filename)
    deck = {
        "id": str(uuid.uuid4()),
        "coach_id": coach_id,
        "title": title or result.get("deckTitle") or file.filename,
        "slides": _slide_ids(result["slides"]),
        "source": "upload",
        "created_at": _now(),
        "updated_at": _now(),
    }
    await db.decks.insert_one(dict(deck))
    deck.pop("_id", None)
    return deck


@api_router.patch("/decks/{deck_id}/slides/{slide_id}/layout")
async def switch_layout(deck_id: str, slide_id: str, body: LayoutPatch, user: dict = Depends(current_user)):
    if body.layout not in ai_layup.LAYOUTS:
        raise HTTPException(status_code=400, detail="Unknown layout")
    deck = await _get_deck(deck_id)
    found = False
    for s in deck["slides"]:
        if s.get("id") == slide_id:
            s["layout"] = body.layout
            found = True
    if not found:
        raise HTTPException(status_code=404, detail="Slide not found")
    await db.decks.update_one({"id": deck_id}, {"$set": {"slides": deck["slides"], "updated_at": _now()}})
    return deck


@api_router.patch("/decks/{deck_id}")
async def patch_deck(deck_id: str, body: DeckPatch, user: dict = Depends(current_user)):
    deck = await _get_deck(deck_id)
    update = {"updated_at": _now()}
    if body.title is not None:
        update["title"] = body.title
    if body.slides is not None:
        update["slides"] = _slide_ids(body.slides)
    await db.decks.update_one({"id": deck_id}, {"$set": update})
    return await _get_deck(deck_id)


@api_router.delete("/decks/{deck_id}")
async def delete_deck(deck_id: str, user: dict = Depends(current_user)):
    await db.decks.delete_one({"id": deck_id})
    return {"ok": True}


@api_router.get("/decks/{deck_id}/export")
async def export_deck(deck_id: str, format: str = "pptx", user: dict = Depends(current_user)):
    deck = await _get_deck(deck_id)
    title = deck.get("title", "deck")
    safe = "".join(ch for ch in title if ch.isalnum() or ch in " -_").strip() or "deck"
    if format == "pdf":
        data = exporters.build_pdf(title, deck["slides"])
        media, ext = "application/pdf", "pdf"
    else:
        data = exporters.build_pptx(title, deck["slides"])
        media, ext = "application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"
    return StreamingResponse(io.BytesIO(data), media_type=media,
                             headers={"Content-Disposition": f'attachment; filename="{safe}.{ext}"'})


# ---------- Replay routes ----------
@api_router.get("/replays")
async def list_replays(coach_id: Optional[str] = None, user: dict = Depends(current_user)):
    q = {}
    if coach_id:
        q["coach_id"] = coach_id
    return await db.replays.find(q, {"_id": 0}).sort("updated_at", -1).to_list(500)


@api_router.get("/replays/{replay_id}")
async def get_replay(replay_id: str, user: dict = Depends(current_user)):
    r = await db.replays.find_one({"id": replay_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Replay not found")
    return r


@api_router.post("/replays")
async def create_replay(body: ReplayBody, user: dict = Depends(current_user)):
    r = {"id": str(uuid.uuid4()), "coach_id": body.coach_id, "title": body.title,
         "config": body.config, "created_at": _now(), "updated_at": _now()}
    await db.replays.insert_one(dict(r))
    r.pop("_id", None)
    return r


@api_router.put("/replays/{replay_id}")
async def update_replay(replay_id: str, body: ReplayBody, user: dict = Depends(current_user)):
    await db.replays.update_one({"id": replay_id},
                                {"$set": {"title": body.title, "config": body.config, "updated_at": _now()}})
    r = await db.replays.find_one({"id": replay_id}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Replay not found")
    return r


@api_router.delete("/replays/{replay_id}")
async def delete_replay(replay_id: str, user: dict = Depends(current_user)):
    await db.replays.delete_one({"id": replay_id})
    return {"ok": True}


@api_router.post("/replays/export")
async def export_replay(body: ExportMedia, user: dict = Depends(current_user)):
    fmt = "mp4" if body.fmt == "mp4" else "gif"
    data = poker_render.render_media(body.frames, fmt=fmt, fps=max(1, min(body.fps, 10)), deck=body.deck or "fourcolour")
    safe = "".join(ch for ch in (body.title or "replay") if ch.isalnum() or ch in " -_").strip() or "replay"
    media = "video/mp4" if fmt == "mp4" else "image/gif"
    return StreamingResponse(io.BytesIO(data), media_type=media,
                             headers={"Content-Disposition": f'attachment; filename="{safe}.{fmt}"'})


@api_router.get("/")
async def root():
    return {"message": "Practical Poker Plus API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "")
    if admin_email:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({"email": admin_email, "password_hash": authlib.hash_password(admin_pw),
                                       "name": "PPP Brand Admin", "role": "admin", "coach_id": None,
                                       "created_at": _now()})
        elif not authlib.verify_password(admin_pw, existing["password_hash"]):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": authlib.hash_password(admin_pw)}})
    for c in COACHES:
        existing = await db.users.find_one({"email": c["email"]})
        doc = {"email": c["email"], "name": c["name"], "role": "coach", "coach_id": c["id"],
               "avatar": c["avatar"], "password_hash": authlib.hash_password(c["password"])}
        if not existing:
            await db.users.insert_one(doc)
        else:
            await db.users.update_one({"email": c["email"]}, {"$set": {
                "name": c["name"], "role": "coach", "coach_id": c["id"], "avatar": c["avatar"]}})
    logger.info("PPP startup complete: seeded admin + coaches")


@app.on_event("shutdown")
async def shutdown():
    client.close()
