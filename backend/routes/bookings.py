from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Booking, Room

bp = Blueprint("bookings", __name__)


def _parse_date(d: str, field: str) -> tuple[bool, str | None, object | None]:
    try:
        return True, None, datetime.strptime(d, "%Y-%m-%d").date()
    except Exception:
        return False, f"Invalid {field}. Use YYYY-MM-DD", None


def _has_overlap(room_id: int, start_date, end_date) -> bool:
    overlap = (
        Booking.query.filter(Booking.room_id == room_id)
        .filter(Booking.status != "cancelled")
        .filter(Booking.start_date < end_date)
        .filter(Booking.end_date > start_date)
        .first()
    )
    return overlap is not None


@bp.post("/book")
@jwt_required()
def book():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    room_id = data.get("room_id")
    start_date_raw = data.get("start_date")
    end_date_raw = data.get("end_date")

    if not isinstance(room_id, int):
        return jsonify({"message": "room_id must be an integer"}), 400
    if not start_date_raw or not end_date_raw:
        return jsonify({"message": "start_date and end_date are required"}), 400

    ok, err, start_date = _parse_date(start_date_raw, "start_date")
    if not ok:
        return jsonify({"message": err}), 400
    ok, err, end_date = _parse_date(end_date_raw, "end_date")
    if not ok:
        return jsonify({"message": err}), 400

    if end_date <= start_date:
        return jsonify({"message": "end_date must be after start_date"}), 400

    room = Room.query.get(room_id)
    if not room:
        return jsonify({"message": "room not found"}), 404

    if _has_overlap(room_id, start_date, end_date):
        return jsonify({"message": "room is not available for the selected dates"}), 409

    nights = (end_date - start_date).days
    total_price = nights * room.price

    booking = Booking(
        user_id=user_id,
        room_id=room_id,
        start_date=start_date,
        end_date=end_date,
        total_price=total_price,
        status="pending",
    )
    db.session.add(booking)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "booking created",
                "booking": {
                    "id": booking.id,
                    "room_id": booking.room_id,
                    "start_date": booking.start_date.isoformat(),
                    "end_date": booking.end_date.isoformat(),
                    "total_price": booking.total_price,
                    "status": booking.status,
                },
            }
        ),
        201,
    )


@bp.get("/user/bookings")
@jwt_required()
def user_bookings():
    user_id = int(get_jwt_identity())
    bookings = (
        Booking.query.filter_by(user_id=user_id)
        .join(Booking.room)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id": b.id,
                "room": {
                    "id": b.room.id,
                    "hotel_id": b.room.hotel_id,
                    "hotel_name": b.room.hotel.name if b.room.hotel else None,
                    "room_type": b.room.room_type,
                    "ac_type": b.room.ac_type,
                    "price": b.room.price,
                },
                "start_date": b.start_date.isoformat(),
                "end_date": b.end_date.isoformat(),
                "total_price": b.total_price,
                "status": b.status,
                "created_at": b.created_at.isoformat(),
            }
            for b in bookings
        ]
    )
