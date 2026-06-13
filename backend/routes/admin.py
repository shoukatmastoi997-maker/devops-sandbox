from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from extensions import bcrypt, db
from models import Booking, Hotel, Room, User
from utils.authz import admin_required

bp = Blueprint("admin", __name__)


@bp.post("/admin/login")
def admin_login():
    """
    Admin login endpoint (separate from normal /login).
    Only users with role=admin can authenticate here.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or user.role != "admin" or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "invalid admin credentials"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}})


@bp.get("/admin/dashboard")
@admin_required
def admin_dashboard():
    return jsonify(
        {
            "totals": {
                "users": User.query.count(),
                "hotels": Hotel.query.count(),
                "rooms": Room.query.count(),
                "bookings": Booking.query.count(),
            }
        }
    )


# --------------------
# Hotels CRUD
# --------------------


def _hotel_to_dict(h: Hotel) -> dict:
    return {"id": h.id, "name": h.name, "location": h.location, "description": h.description}


@bp.post("/admin/hotels")
@admin_required
def create_hotel():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    location = (data.get("location") or "").strip()
    description = (data.get("description") or "").strip()

    if not name or not location:
        return jsonify({"message": "name and location are required"}), 400

    hotel = Hotel(name=name, location=location, description=description)
    db.session.add(hotel)
    db.session.commit()
    return jsonify(_hotel_to_dict(hotel)), 201


@bp.get("/admin/hotels")
@admin_required
def list_hotels():
    hotels = Hotel.query.order_by(Hotel.id.desc()).all()
    return jsonify([_hotel_to_dict(h) for h in hotels])


@bp.put("/admin/hotels/<int:hotel_id>")
@admin_required
def update_hotel(hotel_id: int):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({"message": "hotel not found"}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        hotel.name = (data.get("name") or "").strip()
    if "location" in data:
        hotel.location = (data.get("location") or "").strip()
    if "description" in data:
        hotel.description = (data.get("description") or "").strip()

    if not hotel.name or not hotel.location:
        return jsonify({"message": "name and location are required"}), 400

    db.session.commit()
    return jsonify(_hotel_to_dict(hotel))


@bp.delete("/admin/hotels/<int:hotel_id>")
@admin_required
def delete_hotel(hotel_id: int):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({"message": "hotel not found"}), 404

    db.session.delete(hotel)
    db.session.commit()
    return jsonify({"message": "deleted"})


# --------------------
# Rooms CRUD
# --------------------


def _room_to_dict(r: Room) -> dict:
    return {
        "id": r.id,
        "hotel_id": r.hotel_id,
        "hotel_name": r.hotel.name if r.hotel else None,
        "room_type": r.room_type,
        "capacity": r.capacity,
        "ac_type": r.ac_type,
        "price": r.price,
    }


@bp.post("/admin/rooms")
@admin_required
def create_room():
    data = request.get_json(silent=True) or {}
    hotel_id = data.get("hotel_id")
    room_type = (data.get("room_type") or "").strip()
    capacity = data.get("capacity")
    ac_type = (data.get("ac_type") or "").strip()
    price = data.get("price")

    if not isinstance(hotel_id, int):
        return jsonify({"message": "hotel_id must be an integer"}), 400
    if not Hotel.query.get(hotel_id):
        return jsonify({"message": "hotel not found"}), 404
    if room_type not in {"Single", "Double", "Triple"}:
        return jsonify({"message": "room_type must be Single/Double/Triple"}), 400
    if not isinstance(capacity, int) or capacity < 1:
        return jsonify({"message": "capacity must be an integer >= 1"}), 400
    if ac_type not in {"AC", "Non-AC"}:
        return jsonify({"message": "ac_type must be AC or Non-AC"}), 400
    if not isinstance(price, int) or price < 0:
        return jsonify({"message": "price must be a non-negative integer"}), 400

    room = Room(hotel_id=hotel_id, room_type=room_type, capacity=capacity, ac_type=ac_type, price=price)
    db.session.add(room)
    db.session.commit()
    return jsonify(_room_to_dict(room)), 201


@bp.put("/admin/rooms/<int:room_id>")
@admin_required
def update_room(room_id: int):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"message": "room not found"}), 404

    data = request.get_json(silent=True) or {}
    if "hotel_id" in data:
        hotel_id = data.get("hotel_id")
        if not isinstance(hotel_id, int):
            return jsonify({"message": "hotel_id must be an integer"}), 400
        if not Hotel.query.get(hotel_id):
            return jsonify({"message": "hotel not found"}), 404
        room.hotel_id = hotel_id

    if "room_type" in data:
        room_type = (data.get("room_type") or "").strip()
        if room_type not in {"Single", "Double", "Triple"}:
            return jsonify({"message": "room_type must be Single/Double/Triple"}), 400
        room.room_type = room_type

    if "capacity" in data:
        capacity = data.get("capacity")
        if not isinstance(capacity, int) or capacity < 1:
            return jsonify({"message": "capacity must be an integer >= 1"}), 400
        room.capacity = capacity

    if "ac_type" in data:
        ac_type = (data.get("ac_type") or "").strip()
        if ac_type not in {"AC", "Non-AC"}:
            return jsonify({"message": "ac_type must be AC or Non-AC"}), 400
        room.ac_type = ac_type

    if "price" in data:
        price = data.get("price")
        if not isinstance(price, int) or price < 0:
            return jsonify({"message": "price must be a non-negative integer"}), 400
        room.price = price

    db.session.commit()
    return jsonify(_room_to_dict(room))


@bp.delete("/admin/rooms/<int:room_id>")
@admin_required
def delete_room(room_id: int):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"message": "room not found"}), 404
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "deleted"})


# --------------------
# Bookings
# --------------------


@bp.get("/admin/bookings")
@admin_required
def admin_bookings():
    """
    Optional filters (query params):
    - user_email
    - from (YYYY-MM-DD)
    - to (YYYY-MM-DD)
    """
    user_email = (request.args.get("user_email") or "").strip().lower()
    from_raw = (request.args.get("from") or "").strip()
    to_raw = (request.args.get("to") or "").strip()

    q = Booking.query.join(Booking.user).join(Booking.room).join(Room.hotel)
    if user_email:
        q = q.filter(User.email == user_email)

    def parse_date(s: str):
        return datetime.strptime(s, "%Y-%m-%d").date()

    try:
        if from_raw:
            q = q.filter(Booking.start_date >= parse_date(from_raw))
        if to_raw:
            q = q.filter(Booking.end_date <= parse_date(to_raw))
    except Exception:
        return jsonify({"message": "invalid date filter. Use YYYY-MM-DD"}), 400

    items = q.order_by(Booking.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": b.id,
                "user": {"id": b.user.id, "email": b.user.email, "name": b.user.name},
                "room": {
                    "id": b.room.id,
                    "room_type": b.room.room_type,
                    "ac_type": b.room.ac_type,
                    "price": b.room.price,
                    "hotel": {"id": b.room.hotel.id if b.room.hotel else None, "name": b.room.hotel.name if b.room.hotel else None},
                },
                "start_date": b.start_date.isoformat(),
                "end_date": b.end_date.isoformat(),
                "total_price": b.total_price,
                "status": b.status,
                "created_at": b.created_at.isoformat(),
            }
            for b in items
        ]
    )


@bp.put("/admin/bookings/<int:booking_id>")
@admin_required
def update_booking(booking_id: int):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"message": "booking not found"}), 404

    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip().lower()
    if status not in {"confirmed", "cancelled", "pending"}:
        return jsonify({"message": "status must be confirmed/cancelled/pending"}), 400

    booking.status = status
    db.session.commit()
    return jsonify({"message": "updated", "booking": {"id": booking.id, "status": booking.status}})


# --------------------
# Users (optional delete)
# --------------------


@bp.get("/admin/users")
@admin_required
def admin_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users])


@bp.delete("/admin/users/<int:user_id>")
@admin_required
def delete_user(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "user not found"}), 404
    if user.role == "admin":
        return jsonify({"message": "cannot delete admin user"}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "deleted"})

