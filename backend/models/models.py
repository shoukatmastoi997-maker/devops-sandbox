from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, UniqueConstraint

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password = db.Column(db.String(255), nullable=False)  # bcrypt hash
    role = db.Column(db.String(20), nullable=False, default="user")  # "admin" / "user"

    preferences = db.relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    bookings = db.relationship("Booking", back_populates="user", cascade="all, delete-orphan")


class Preference(db.Model):
    __tablename__ = "preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    people_count = db.Column(db.Integer, nullable=False)
    room_type = db.Column(db.String(40), nullable=False)
    budget = db.Column(db.Integer, nullable=False)
    ac_type = db.Column(db.String(20), nullable=False)  # "AC" / "Non-AC"
    # Extra questionnaire answers (optional). These help the recommender feel more "AI" in FYP demos.
    budget_strictness = db.Column(db.String(20), nullable=True)  # strict/normal/flexible
    comfort_priority = db.Column(db.String(20), nullable=True)  # budget/balanced/comfort
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship("User", back_populates="preferences")

    __table_args__ = (
        CheckConstraint("people_count >= 1", name="ck_people_count_min_1"),
        CheckConstraint("budget >= 0", name="ck_budget_non_negative"),
    )


class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey("hotels.id"), nullable=False, index=True)
    room_type = db.Column(db.String(40), nullable=False)  # Single/Double/Triple
    capacity = db.Column(db.Integer, nullable=False)
    ac_type = db.Column(db.String(20), nullable=False)  # "AC" / "Non-AC"
    price = db.Column(db.Integer, nullable=False)  # price per night (PKR)

    hotel = db.relationship("Hotel", back_populates="rooms")
    bookings = db.relationship("Booking", back_populates="room", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("capacity >= 1", name="ck_room_capacity_min_1"),
        CheckConstraint("price >= 0", name="ck_room_price_non_negative"),
    )


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False, index=True)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)  # checkout date (must be > start_date)

    total_price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(40), nullable=False, default="pending")  # pending/confirmed/cancelled

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship("User", back_populates="bookings")
    room = db.relationship("Room", back_populates="bookings")
    payment = db.relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("total_price >= 0", name="ck_booking_total_price_non_negative"),
    )


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False, index=True)
    amount = db.Column(db.Integer, nullable=False)
    payment_status = db.Column(db.String(40), nullable=False, default="unpaid")  # unpaid/paid/failed
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    booking = db.relationship("Booking", back_populates="payment")

    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_payments_booking_id"),
        CheckConstraint("amount >= 0", name="ck_payment_amount_non_negative"),
    )


class Hotel(db.Model):
    __tablename__ = "hotels"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False, default="")

    rooms = db.relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
