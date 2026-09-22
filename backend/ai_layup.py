import json
import os
import re

from emergentintegrations.llm.chat import LlmChat, UserMessage

LAYOUTS = [
    "title", "section", "bullets", "two_column", "subheader_box",
    "table_felt", "image_text", "stats", "takeaways", "quote",
]

SYSTEM_MESSAGE = """You are the brand-layout engine for "Practical Poker Plus" (PPP), an educational poker brand.
You take a coach's RAW poker lecture material and lay it out into a branded slide deck.

Split the content into a logical sequence of slides (aim for 6-14 slides). For EACH slide pick the single
best-fitting layout from this exact list and fill the relevant fields:

- "title"        : opening / cover slide. fields: title, subtitle
- "section"      : divider that opens a new topic. fields: label (e.g. "LECTURE 01"), title
- "bullets"      : a heading with 3-6 concise bullet points. fields: title, bullets[]
- "two_column"   : compare two ideas side by side. fields: title, leftHeading, leftBody, rightHeading, rightBody
- "subheader_box": one key concept explained. fields: title, subHeader, body
- "table_felt"   : a scenario / hand example shown on poker-table felt. fields: title, body
- "image_text"   : concept + poker motif. fields: title, body, motif ("chips" | "cards")
- "stats"        : numeric facts (odds, EV, %). fields: title, stats[{label, value}]
- "takeaways"    : summary of key points. fields: title, points[]
- "quote"        : a memorable pro tip / quote. fields: quote, author

Rules:
- Keep text punchy and presentation-ready. Rewrite rambling prose into crisp bullets/short lines.
- Titles should be short and impactful (they render in ALL CAPS).
- Bullets/points: max ~12 words each.
- Always start with a "title" slide and end with a "takeaways" slide.
- Use "stats" whenever the content mentions odds, percentages, pot odds, EV or numbers.

Return ONLY valid JSON, no markdown fences, in this exact shape:
{
  "deckTitle": "string",
  "slides": [
    { "layout": "title", "title": "...", "subtitle": "...", "bullets": [], "points": [], "stats": [],
      "leftHeading": "", "leftBody": "", "rightHeading": "", "rightBody": "",
      "subHeader": "", "body": "", "label": "", "motif": "", "quote": "", "author": "" }
  ]
}
Every slide object MUST contain every field key shown above (use "" or [] when unused) so layouts can be swapped later."""


def _empty_slide():
    return {
        "layout": "bullets", "title": "", "subtitle": "", "bullets": [], "points": [],
        "stats": [], "leftHeading": "", "leftBody": "", "rightHeading": "", "rightBody": "",
        "subHeader": "", "body": "", "label": "", "motif": "", "quote": "", "author": "",
    }


def _coerce(data: dict) -> dict:
    slides = []
    for s in data.get("slides", []):
        base = _empty_slide()
        base.update({k: v for k, v in s.items() if k in base})
        if base["layout"] not in LAYOUTS:
            base["layout"] = "bullets"
        slides.append(base)
    return {"deckTitle": data.get("deckTitle") or "Untitled Lecture", "slides": slides}


async def generate_deck(raw_text: str, hint_title: str = "") -> dict:
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id="ppp-layup",
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-4-6")

    prompt = raw_text.strip()
    if hint_title:
        prompt = f"Deck working title: {hint_title}\n\nRAW LECTURE CONTENT:\n{prompt}"
    else:
        prompt = f"RAW LECTURE CONTENT:\n{prompt}"

    resp = await chat.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else str(resp)

    # strip code fences / extract JSON object
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        text = m.group(0)
    data = json.loads(text)
    return _coerce(data)
