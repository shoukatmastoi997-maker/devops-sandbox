from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Booking, Payment

bp = Blueprint("payments", __name__)


@bp.post("/payment")
@jwt_required()
def pay():
    """
    Demo-only payment API:
    - Accepts card fields (not stored)
    - Always returns success
    - Stores a Payment record + confirms the booking
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    booking_id = data.get("booking_id")
    if not isinstance(booking_id, int):
        return jsonify({"message": "booking_id must be an integer"}), 400

    booking = Booking.query.get(booking_id)
    if not booking or booking.user_id != user_id:
        return jsonify({"message": "booking not found"}), 404

    if booking.status == "confirmed":
        existing_payment = Payment.query.filter_by(booking_id=booking.id).first()
        return jsonify({"message": "already paid", "payment_status": existing_payment.payment_status if existing_payment else "paid"})

    # Card inputs are accepted to simulate UI, but we don't store them.
    _ = (data.get("card_number"), data.get("expiry"), data.get("cvv"))

    payment = Payment.query.filter_by(booking_id=booking.id).first()
    if not payment:
        payment = Payment(booking_id=booking.id, amount=booking.total_price, payment_status="paid")
        db.session.add(payment)
    else:
        payment.amount = booking.total_price
        payment.payment_status = "paid"

    booking.status = "confirmed"
    db.session.commit()

    return jsonify({"message": "Payment Successful", "payment": {"id": payment.id, "amount": payment.amount, "payment_status": payment.payment_status}})
