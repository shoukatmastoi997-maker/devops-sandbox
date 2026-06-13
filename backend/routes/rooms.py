from __future__ import annotations

from flask import Blueprint, jsonify, request

from models import Hotel, Room

bp = Blueprint("rooms", __name__)


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


def _hotel_to_dict(h: Hotel) -> dict:
    return {"id": h.id, "name": h.name, "location": h.location, "description": h.description}


@bp.get("/rooms")
def list_rooms():
    rooms = Room.query.order_by(Room.price.asc()).all()
    return jsonify([_room_to_dict(r) for r in rooms])


@bp.get("/rooms/filter")
def filter_rooms():
    """
    Query params:
    - capacity: int (minimum capacity)
    - max_price: int
    - ac_type: "AC" or "Non-AC"
    - hotel_id: int
    - sort: price_asc | price_desc
    """
    capacity = request.args.get("capacity", type=int)
    max_price = request.args.get("max_price", type=int)
    ac_type = (request.args.get("ac_type") or "").strip()
    hotel_id = request.args.get("hotel_id", type=int)
    sort = (request.args.get("sort") or "price_asc").strip()

    q = Room.query
    if hotel_id:
        q = q.filter(Room.hotel_id == hotel_id)
    if capacity:
        q = q.filter(Room.capacity >= capacity)
    if max_price is not None:
        q = q.filter(Room.price <= max_price)
    if ac_type in {"AC", "Non-AC"}:
        q = q.filter(Room.ac_type == ac_type)

    if sort == "price_desc":
        q = q.order_by(Room.price.desc())
    else:
        q = q.order_by(Room.price.asc())

    rooms = q.all()
    return jsonify([_room_to_dict(r) for r in rooms])


@bp.get("/hotels")
def list_hotels():
    hotels = Hotel.query.order_by(Hotel.id.asc()).all()
    return jsonify([_hotel_to_dict(h) for h in hotels])
