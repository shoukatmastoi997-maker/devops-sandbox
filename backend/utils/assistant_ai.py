from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass

from config import Config
from models import Preference, Room


@dataclass(frozen=True)
class AssistantReply:
    message: str
    suggested_rooms: list[dict]
    used_openai: bool


def _rooms_snapshot(limit: int = 12) -> list[dict]:
    rooms = Room.query.order_by(Room.price.asc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "hotel_id": r.hotel_id,
            "hotel_name": r.hotel.name if r.hotel else None,
            "room_type": r.room_type,
            "capacity": r.capacity,
            "ac_type": r.ac_type,
            "price": r.price,
        }
        for r in rooms
    ]


def _latest_pref(user_id: int) -> dict | None:
    p = Preference.query.filter_by(user_id=user_id).order_by(Preference.created_at.desc()).first()
    if not p:
        return None
    return {
        "people_count": p.people_count,
        "room_type": p.room_type,
        "budget": p.budget,
        "ac_type": p.ac_type,
        "budget_strictness": p.budget_strictness,
        "comfort_priority": p.comfort_priority,
        "created_at": p.created_at.isoformat(),
    }


def _rule_based_reply(*, user_id: int, message: str) -> AssistantReply:
    """
    Very simple chatbot fallback (no external API). Keeps the app functional without OPENAI_API_KEY.
    """
    msg = (message or "").strip()
    m = msg.lower()
    rooms = _rooms_snapshot(limit=12)
    pref = _latest_pref(user_id)

    def find_int(pattern: str) -> int | None:
        mm = re.search(pattern, m)
        if not mm:
            return None
        try:
            return int(mm.group(1))
        except Exception:
            return None

    budget = find_int(r"(?:budget|pkr)\s*[:=]?\s*(\d+)")
    guests = find_int(r"(?:guests|people|persons|person)\s*[:=]?\s*(\d+)")

    # Quick intents
    if any(x in m for x in ["hello", "hi", "assalam", "salam"]):
        return AssistantReply(
            message="Hello. Tell me your budget and number of guests, and I will recommend rooms.",
            suggested_rooms=rooms[:4],
            used_openai=False,
        )

    if "cheap" in m or "low" in m or "budget" in m:
        cheapest = sorted(rooms, key=lambda r: r["price"])[:6]
        return AssistantReply(
            message="Here are the lowest-priced rooms available right now.",
            suggested_rooms=cheapest,
            used_openai=False,
        )

    # Filter by parsed budget/guests if provided
    filtered = rooms
    if budget is not None:
        filtered = [r for r in filtered if r["price"] <= budget]
    if guests is not None:
        filtered = [r for r in filtered if r["capacity"] >= guests]

    # If user already did questionnaire, bias to their last AC type
    if pref and pref.get("ac_type") in {"AC", "Non-AC"}:
        filtered = [r for r in filtered if r["ac_type"] == pref["ac_type"]] or filtered

    if filtered:
        return AssistantReply(
            message="Based on your message, these rooms match best. If you want, tell me dates and location too.",
            suggested_rooms=filtered[:6],
            used_openai=False,
        )

    return AssistantReply(
        message="I could not find a perfect match from the current list. Try increasing budget or lowering guests.",
        suggested_rooms=rooms[:6],
        used_openai=False,
    )


def _openai_reply(*, user_id: int, message: str) -> AssistantReply:
    """
    OpenAI-backed assistant. Uses the server-side API key from env/config.
    """
    # Import lazily so the project can run without the dependency installed.
    from openai import OpenAI

    api_key = (os.getenv("OPENAI_API_KEY") or Config.OPENAI_API_KEY or "").strip()
    model = (os.getenv("OPENAI_MODEL") or Config.OPENAI_MODEL or "gpt-4.1-mini").strip()
    client = OpenAI(api_key=api_key)

    rooms = _rooms_snapshot(limit=20)
    pref = _latest_pref(user_id)

    system = (
        "You are a hotel reservation assistant for a Final Year Project web app. "
        "Be concise, polite, and practical. "
        "When recommending rooms, use only the rooms provided in ROOMS_JSON. "
        "If information is missing, ask 1-2 clarifying questions. "
        "Always end with a short next step."
    )

    user = {
        "message": (message or "").strip(),
        "latest_preference": pref,
        "ROOMS_JSON": rooms,
        "output_format": {
            "reply": "string",
            "suggested_room_ids": "array of integers (subset of ROOMS_JSON)",
        },
    }

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=True)},
        ],
        temperature=0.4,
        max_tokens=350,
    )

    content = (resp.choices[0].message.content or "").strip()
    suggested_ids: list[int] = []
    reply_text = content

    # Try to parse JSON from the model (best-effort, fallback to plain text).
    try:
        obj = json.loads(content)
        reply_text = str(obj.get("reply") or "").strip() or content
        suggested_ids = [int(x) for x in (obj.get("suggested_room_ids") or []) if str(x).isdigit()]
    except Exception:
        # If model returned plain text, we still provide a reasonable room list.
        pass

    id_set = set(suggested_ids)
    suggested = [r for r in rooms if r["id"] in id_set] if id_set else rooms[:6]
    return AssistantReply(message=reply_text, suggested_rooms=suggested, used_openai=True)


def chat_reply(*, user_id: int, message: str) -> AssistantReply:
    api_key = (os.getenv("OPENAI_API_KEY") or Config.OPENAI_API_KEY or "").strip()
    if api_key:
        try:
            return _openai_reply(user_id=user_id, message=message)
        except Exception:
            # Never break the UX because of external API errors.
            return _rule_based_reply(user_id=user_id, message=message)
    return _rule_based_reply(user_id=user_id, message=message)

