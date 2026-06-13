from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from utils.assistant_ai import chat_reply

bp = Blueprint("assistant", __name__)


@bp.post("/assistant/chat")
@jwt_required()
def assistant_chat():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"message": "message is required"}), 400

    reply = chat_reply(user_id=user_id, message=message)
    return jsonify(
        {
            "reply": reply.message,
            "suggested_rooms": reply.suggested_rooms,
            "used_openai": reply.used_openai,
        }
    )

