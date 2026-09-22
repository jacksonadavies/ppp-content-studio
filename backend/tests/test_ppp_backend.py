"""PPP backend end-to-end API tests."""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend env file
    envp = "/app/frontend/.env"
    if os.path.exists(envp):
        for line in open(envp):
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def coach_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "alex@practicalpokerplus.com", "password": "coach1234"},
                      timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["user"]["coach_id"] == "alex-vance"
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(coach_token):
    return {"Authorization": f"Bearer {coach_token}"}


# ---------- Auth ----------
def test_login_invalid():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "alex@practicalpokerplus.com", "password": "wrong"},
                      timeout=15)
    assert r.status_code == 401


def test_all_coach_logins():
    for email in ["alex@practicalpokerplus.com", "elena@practicalpokerplus.com",
                  "marcus@practicalpokerplus.com", "david@practicalpokerplus.com"]:
        r = requests.post(f"{API}/auth/login",
                          json={"email": email, "password": "coach1234"}, timeout=15)
        assert r.status_code == 200, f"{email}: {r.text}"


def test_admin_login():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "brand@practicalpokerplus.com", "password": "PPPadmin2025!"},
                      timeout=15)
    assert r.status_code == 200


def test_me_bearer(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["email"] == "alex@practicalpokerplus.com"


def test_me_unauth():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_coaches():
    r = requests.get(f"{API}/coaches", timeout=10)
    assert r.status_code == 200
    assert len(r.json()) == 4


# ---------- Decks ----------
RAW_TEXT = (
    "Pot odds and equity are foundational. When facing a bet on the turn, "
    "compare the price you're getting to the equity of your hand. If you have "
    "9 outs to a flush on the turn, that's ~19% equity. If the bet is 33% pot, "
    "you need 25% equity to call. Consider implied odds. Position matters: in "
    "position we can control pot size. Aggression wins. Balance your range."
)


@pytest.fixture(scope="session")
def generated_deck(auth_headers):
    r = requests.post(f"{API}/decks/generate",
                      headers=auth_headers,
                      json={"coach_id": "alex-vance",
                            "title": "TEST_ Pot Odds Basics",
                            "raw_text": RAW_TEXT},
                      timeout=120)
    assert r.status_code == 200, r.text
    deck = r.json()
    assert deck["id"] and 6 <= len(deck["slides"]) <= 14
    assert all("id" in s and "layout" in s for s in deck["slides"])
    layouts = {s["layout"] for s in deck["slides"]}
    assert len(layouts) >= 2, f"Expected varied layouts, got {layouts}"
    return deck


def test_deck_generate(generated_deck):
    assert generated_deck["title"] == "TEST_ Pot Odds Basics"


def test_list_decks(auth_headers, generated_deck):
    r = requests.get(f"{API}/decks", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()]
    assert generated_deck["id"] in ids


def test_get_deck(auth_headers, generated_deck):
    r = requests.get(f"{API}/decks/{generated_deck['id']}", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["id"] == generated_deck["id"]


def test_switch_layout(auth_headers, generated_deck):
    slide_id = generated_deck["slides"][1]["id"]
    r = requests.patch(f"{API}/decks/{generated_deck['id']}/slides/{slide_id}/layout",
                       headers=auth_headers, json={"layout": "two_column"}, timeout=10)
    assert r.status_code == 200
    updated = r.json()
    matched = [s for s in updated["slides"] if s["id"] == slide_id]
    assert matched[0]["layout"] == "two_column"


def test_patch_deck_title(auth_headers, generated_deck):
    r = requests.patch(f"{API}/decks/{generated_deck['id']}",
                       headers=auth_headers, json={"title": "TEST_ Updated Title"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_ Updated Title"
    # verify persistence
    r2 = requests.get(f"{API}/decks/{generated_deck['id']}", headers=auth_headers, timeout=10)
    assert r2.json()["title"] == "TEST_ Updated Title"


def test_export_pptx(auth_headers, generated_deck):
    r = requests.get(f"{API}/decks/{generated_deck['id']}/export?format=pptx",
                     headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/vnd.openxmlformats")
    assert len(r.content) > 1000
    assert r.content[:2] == b"PK"


def test_export_pdf(auth_headers, generated_deck):
    r = requests.get(f"{API}/decks/{generated_deck['id']}/export?format=pdf",
                     headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


def test_upload_deck_txt(auth_headers):
    files = {"file": ("lesson.txt", RAW_TEXT.encode(), "text/plain")}
    data = {"coach_id": "alex-vance", "title": "TEST_ Uploaded Lesson"}
    r = requests.post(f"{API}/decks/upload", headers=auth_headers,
                      files=files, data=data, timeout=120)
    assert r.status_code == 200, r.text
    deck = r.json()
    assert deck["source"] == "upload"
    assert 6 <= len(deck["slides"]) <= 14


# ---------- Replays ----------
@pytest.fixture(scope="session")
def replay_config():
    return {
        "players": 6, "sb": 1, "bb": 2, "buttonSeat": 0,
        "seats": [
            {"name": "Hero", "stack": 200, "cards": ["As", "Ks"], "reveal": True},
            {"name": "P2", "stack": 200, "cards": [], "reveal": False},
        ],
        "board": ["Qh", "Jd", "2c"],
        "actions": [{"type": "bet", "seat": 0, "amount": 5}],
    }


def test_create_and_get_replay(auth_headers, replay_config):
    r = requests.post(f"{API}/replays", headers=auth_headers,
                      json={"coach_id": "alex-vance", "title": "TEST_ Replay",
                            "config": replay_config}, timeout=10)
    assert r.status_code == 200
    replay = r.json()
    assert replay["id"]

    r2 = requests.get(f"{API}/replays/{replay['id']}", headers=auth_headers, timeout=10)
    assert r2.status_code == 200
    assert r2.json()["config"]["players"] == 6


def test_export_replay_gif(auth_headers):
    frames = [{"board": [], "seats": [{"name": "Hero", "cards": ["As", "Ks"], "reveal": True}]},
              {"board": ["Qh", "Jd", "2c"], "seats": [{"name": "Hero", "cards": ["As", "Ks"], "reveal": True}]}]
    r = requests.post(f"{API}/replays/export", headers=auth_headers,
                      json={"fmt": "gif", "fps": 2, "frames": frames, "title": "TEST_ Replay GIF"},
                      timeout=60)
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "image/gif"
    assert r.content[:3] == b"GIF"


def test_export_replay_mp4(auth_headers):
    frames = [{"board": [], "seats": [{"name": "Hero", "cards": ["As", "Ks"], "reveal": True}]},
              {"board": ["Qh"], "seats": [{"name": "Hero", "cards": ["As", "Ks"], "reveal": True}]}]
    r = requests.post(f"{API}/replays/export", headers=auth_headers,
                      json={"fmt": "mp4", "fps": 2, "frames": frames, "title": "TEST_ Replay MP4"},
                      timeout=120)
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "video/mp4"
    assert len(r.content) > 200
