from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime
from math import exp

from models import Booking, Hotel, Preference, Room


@dataclass(frozen=True)
class Recommendation:
    room_type: str
    ac_type: str
    estimated_price: int


def _recommend_room_type(people_count: int) -> str:
    if people_count <= 1:
        return "Single"
    if people_count == 2:
        return "Double"
    if 3 <= people_count <= 4:
        return "Triple"
    return "Multiple Rooms"


def _recommend_ac_type(*, user_id: int, budget: int, user_preference: str | None) -> str:
    """
    Explainable + personalized AC choice:
    - Default by budget: < 3000 => Non-AC, otherwise AC
    - If user explicitly chooses AC / Non-AC, that overrides the budget rule.
    - If the user has history, bias towards their most common AC type.
    """
    normalized = (user_preference or "").strip().lower()
    if normalized in {"ac", "a/c"}:
        return "AC"
    if normalized in {"non-ac", "non ac", "nonac"}:
        return "Non-AC"

    # History-based bias (simple, robust, and easy to defend in viva).
    prefs: list[Preference] = (
        Preference.query.filter_by(user_id=user_id).order_by(Preference.created_at.desc()).limit(30).all()
    )
    if prefs:
        counts = Counter([p.ac_type for p in prefs if p.ac_type in {"AC", "Non-AC"}])
        most_common = counts.most_common(1)[0][0] if counts else None
        if most_common:
            # If budget is very low, still allow history to win (people do choose comfort over cost).
            return most_common

    return "Non-AC" if budget < 3000 else "AC"


def _parse_date(d: str | None) -> date | None:
    if not d:
        return None
    return datetime.strptime(d, "%Y-%m-%d").date()


def _room_is_available(room_id: int, start_date: date, end_date: date) -> bool:
    """
    Overlap rule (very common in booking systems):
      existing overlaps if start < existing_end AND end > existing_start
    """
    overlap = (
        Booking.query.filter(Booking.room_id == room_id)
        .filter(Booking.status != "cancelled")
        .filter(Booking.start_date < end_date)
        .filter(Booking.end_date > start_date)
        .first()
    )
    return overlap is None


def _sigmoid(x: float) -> float:
    # Avoid dependency; smooth clamp to 0..1.
    return 1.0 / (1.0 + exp(-x))


def _room_score(
    *,
    room: Room,
    people_count: int,
    budget: int,
    target_room_type: str,
    target_ac_type: str,
    user_booked_hotel_ids: set[int],
    hotel_popularity: dict[int, int],
    budget_strictness: str | None,
    comfort_priority: str | None,
) -> tuple[int, list[str]]:
    """
    Returns (score_0_100, reasons[]).
    The score is intentionally explainable and stable for demos.
    """
    reasons: list[str] = []

    # Capacity fit: hard-ish requirement.
    if people_count <= 4:
        if room.capacity < people_count:
            return 0, ["Insufficient capacity for your group size"]
        if room.capacity == people_count:
            reasons.append(f"Fits exactly for {people_count} people")
            capacity_score = 1.0
        else:
            reasons.append(f"Fits comfortably for {people_count} people")
            capacity_score = 0.9
    else:
        # Multiple rooms scenario: capacity per room is less strict.
        capacity_score = 0.65

    # Room type match (for <=4 people).
    if target_room_type == "Multiple Rooms":
        type_score = 0.7
    else:
        if room.room_type == target_room_type:
            type_score = 1.0
            reasons.append(f"Matches recommended room type ({target_room_type})")
        else:
            type_score = 0.4

    # AC match.
    if room.ac_type == target_ac_type:
        ac_score = 1.0
        reasons.append(f"Matches {target_ac_type} preference")
    else:
        ac_score = 0.0

    strict = (budget_strictness or "normal").strip().lower()
    comfort = (comfort_priority or "balanced").strip().lower()

    # Budget/price match (soft).
    if budget <= 0:
        price_score = 0.0
    elif room.price <= budget:
        # Closer to budget is often "better value" (user likely picked budget as a comfort zone).
        closeness = 1.0 - (abs(budget - room.price) / max(budget, 1))
        price_score = 0.6 + 0.4 * max(0.0, closeness)
        reasons.append("Within your budget")
    else:
        # Penalize above budget smoothly.
        over = (room.price - budget) / max(budget, 1)
        if strict == "strict":
            k = 10.0
            label = "Above your budget"
        elif strict == "flexible":
            k = 4.5
            label = "Slightly above your budget"
        else:
            k = 6.5
            label = "Slightly above your budget"
        price_score = 0.4 * _sigmoid(-k * over)
        reasons.append(label)

    # Personalization: boost hotels you have booked before.
    if room.hotel_id in user_booked_hotel_ids:
        personal_score = 1.0
        reasons.append("You have booked this hotel before")
    else:
        personal_score = 0.0

    # Popularity proxy: bookings per hotel (global). Normalized via sigmoid.
    pop = hotel_popularity.get(room.hotel_id, 0)
    popularity_score = _sigmoid((pop - 2) / 2.0)  # starts to matter after a few bookings
    if pop >= 3:
        reasons.append("Popular choice among users")

    # Weighted sum -> 0..100 (adjusted by comfort priority so the extra questions matter).
    if comfort == "comfort":
        w_capacity, w_type, w_price, w_ac, w_pop, w_personal = 0.30, 0.24, 0.14, 0.22, 0.06, 0.04
    elif comfort == "budget":
        w_capacity, w_type, w_price, w_ac, w_pop, w_personal = 0.26, 0.18, 0.30, 0.16, 0.06, 0.04
    else:
        w_capacity, w_type, w_price, w_ac, w_pop, w_personal = 0.28, 0.22, 0.22, 0.18, 0.06, 0.04

    raw = (
        w_capacity * capacity_score
        + w_type * type_score
        + w_price * price_score
        + w_ac * ac_score
        + w_pop * popularity_score
        + w_personal * personal_score
    )
    score = int(round(100.0 * max(0.0, min(1.0, raw))))

    # Keep reasons short and non-repetitive for UI.
    dedup: list[str] = []
    for r in reasons:
        if r not in dedup:
            dedup.append(r)
    return score, dedup[:5]


def recommend_room(
    *,
    user_id: int,
    people_count: int,
    budget: int,
    ac_preference: str | None,
    start_date: str | None = None,
    end_date: str | None = None,
    location: str | None = None,
    mode: str | None = None,
    budget_strictness: str | None = None,
    comfort_priority: str | None = None,
) -> tuple[Recommendation, list[Room], list[dict]]:
    """
    Returns:
    - Recommendation object
    - Matching rooms (optionally filtered by availability if dates provided)
    - Ranked rooms with scores + reasons (for a more "AI" feel while staying explainable)
    """
    room_type = _recommend_room_type(people_count)
    ac_type = _recommend_ac_type(user_id=user_id, budget=budget, user_preference=ac_preference)

    # Save user's latest preference so returning user can get smart suggestions.
    pref = Preference(
        user_id=user_id,
        people_count=people_count,
        room_type=room_type,
        budget=budget,
        ac_type=ac_type,
        budget_strictness=(budget_strictness or None),
        comfort_priority=(comfort_priority or None),
    )
    from extensions import db

    db.session.add(pref)
    db.session.commit()

    # Candidate selection:
    # - Always respect AC type (unless user didn't care; in that case ac_type is inferred/personalized).
    # - For <=4 people, enforce minimum capacity and recommended room_type.
    query = Room.query.filter(Room.ac_type == ac_type)
    if people_count <= 4:
        query = query.filter(Room.capacity >= people_count)
        if room_type != "Multiple Rooms":
            query = query.filter(Room.room_type == room_type)

    # Optional location filter (simple contains-match on Hotel.location via relationship).
    # Kept optional and non-strict to avoid "no results" demos.
    loc = (location or "").strip()
    if loc:
        try:
            query = query.join(Room.hotel).filter(Hotel.location.ilike(f"%{loc}%"))
        except Exception:
            # If join/LIKE fails for any reason, skip location filtering.
            pass

    rooms = query.order_by(Room.price.asc()).all()

    s = _parse_date(start_date)
    e = _parse_date(end_date)
    if s and e:
        rooms = [r for r in rooms if _room_is_available(r.id, s, e)]

    estimated_price = rooms[0].price if rooms else 0

    # Build ranking inputs (user history + popularity).
    recent_bookings: list[Booking] = (
        Booking.query.filter_by(user_id=user_id).join(Booking.room).order_by(Booking.created_at.desc()).limit(50).all()
    )
    user_booked_hotel_ids = {b.room.hotel_id for b in recent_bookings if b.room}

    # Popularity: bookings per hotel (global).
    hotel_popularity: dict[int, int] = {}
    all_recent: list[Booking] = Booking.query.join(Booking.room).order_by(Booking.created_at.desc()).limit(250).all()
    for b in all_recent:
        if b.room:
            hotel_popularity[b.room.hotel_id] = hotel_popularity.get(b.room.hotel_id, 0) + 1

    ranked: list[dict] = []
    for r in rooms[:200]:  # cap to keep request snappy
        score, reasons = _room_score(
            room=r,
            people_count=people_count,
            budget=budget,
            target_room_type=room_type,
            target_ac_type=ac_type,
            user_booked_hotel_ids=user_booked_hotel_ids,
            hotel_popularity=hotel_popularity,
            budget_strictness=budget_strictness,
            comfort_priority=comfort_priority,
        )
        ranked.append(
            {
                "id": r.id,
                "hotel_id": r.hotel_id,
                "hotel_name": r.hotel.name if r.hotel else None,
                "room_type": r.room_type,
                "capacity": r.capacity,
                "ac_type": r.ac_type,
                "price": r.price,
                "score": score,
                "reasons": reasons,
            }
        )

    ranked.sort(key=lambda x: (x["score"], -x["price"]), reverse=True)

    # Mode can affect how we present results (UI-level, no hidden behavior).
    # - "best_match": default balanced scoring (already)
    # - "lowest_price": re-sort by price asc within a good-score window
    # - "personalized": favor personal history by slight bump
    mode_norm = (mode or "").strip().lower()
    if mode_norm == "lowest_price":
        ranked.sort(key=lambda x: (-(x["score"]), x["price"]))
    elif mode_norm == "personalized":
        def bump(item: dict) -> float:
            bonus = 8 if "You have booked this hotel before" in (item.get("reasons") or []) else 0
            return item["score"] + bonus
        ranked.sort(key=lambda x: (bump(x), -x["price"]), reverse=True)

    return Recommendation(room_type=room_type, ac_type=ac_type, estimated_price=estimated_price), rooms, ranked[:12]


def smart_recommendation_for_returning_user(*, user_id: int) -> dict:
    """
    Lightweight personalization using history:
    - Room-type frequency (from bookings)
    - AC preference frequency (from preferences)
    - Budget trend (median-ish via most common bucket)
    """
    bookings: list[Booking] = (
        Booking.query.filter_by(user_id=user_id)
        .join(Booking.room)
        .order_by(Booking.created_at.desc())
        .limit(50)
        .all()
    )
    preferences: list[Preference] = (
        Preference.query.filter_by(user_id=user_id).order_by(Preference.created_at.desc()).limit(50).all()
    )

    room_types = [b.room.room_type for b in bookings if b.room]
    ac_types = [p.ac_type for p in preferences]
    budgets = [p.budget for p in preferences]

    most_common_room_type = Counter(room_types).most_common(1)[0][0] if room_types else None
    most_common_ac_type = Counter(ac_types).most_common(1)[0][0] if ac_types else None
    avg_budget = int(sum(budgets) / max(len(budgets), 1)) if budgets else None

    suggested_rooms: list[Room] = []
    if most_common_ac_type:
        q = Room.query.filter(Room.ac_type == most_common_ac_type)
        if most_common_room_type:
            q = q.filter(Room.room_type == most_common_room_type)
        suggested_rooms = q.order_by(Room.price.asc()).limit(6).all()

    return {
        "history": [
            {
                "id": b.id,
                "room_id": b.room_id,
                "room_type": b.room.room_type if b.room else None,
                "ac_type": b.room.ac_type if b.room else None,
                "price_per_night": b.room.price if b.room else None,
                "start_date": b.start_date.isoformat(),
                "end_date": b.end_date.isoformat(),
                "total_price": b.total_price,
                "status": b.status,
                "created_at": b.created_at.isoformat(),
            }
            for b in bookings
        ],
        "patterns": {
            "most_common_room_type": most_common_room_type,
            "most_common_ac_type": most_common_ac_type,
            "avg_budget": avg_budget,
            "total_bookings_considered": len(bookings),
            "total_preferences_considered": len(preferences),
        },
        "suggested_rooms": [
            {
                "id": r.id,
                "hotel_id": r.hotel_id,
                "hotel_name": r.hotel.name if r.hotel else None,
                "room_type": r.room_type,
                "capacity": r.capacity,
                "ac_type": r.ac_type,
                "price": r.price,
            }
            for r in suggested_rooms
        ],
        "generated_at": datetime.utcnow().isoformat(),
    }
