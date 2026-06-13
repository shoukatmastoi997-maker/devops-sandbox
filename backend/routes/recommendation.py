from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from utils.recommender import recommend_room, smart_recommendation_for_returning_user

bp = Blueprint("recommendation", __name__)


@bp.post("/recommend")
@jwt_required()
def recommend():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    people_count = data.get("people_count")
    budget = data.get("budget")
    ac_preference = data.get("ac_preference")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    location = data.get("location")
    mode = data.get("mode")
    budget_strictness = data.get("budget_strictness")
    comfort_priority = data.get("comfort_priority")

    if not isinstance(people_count, int) or people_count < 1:
        return jsonify({"message": "people_count must be an integer >= 1"}), 400
    if not isinstance(budget, int) or budget < 0:
        return jsonify({"message": "budget must be a non-negative integer"}), 400

    rec, rooms, ranked = recommend_room(
        user_id=user_id,
        people_count=people_count,
        budget=budget,
        ac_preference=ac_preference,
        start_date=start_date,
        end_date=end_date,
        location=location,
        mode=mode,
        budget_strictness=budget_strictness,
        comfort_priority=comfort_priority,
    )

    top_pick = ranked[0] if ranked else None
    return jsonify(
        {
            "recommended_room_type": rec.room_type,
            "recommended_ac_type": rec.ac_type,
            "estimated_price": rec.estimated_price,
            "top_pick": top_pick,
            "ranked_rooms": ranked,
            "matching_rooms": [
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
            ],
        }
    )


@bp.get("/user/insights")
@jwt_required()
def insights():
    user_id = int(get_jwt_identity())
    return jsonify(smart_recommendation_for_returning_user(user_id=user_id))
