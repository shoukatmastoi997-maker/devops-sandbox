from __future__ import annotations

"""
Run once to create sample rooms so your demo looks real.

PowerShell:
  cd backend
  python seed.py
"""

from app import create_app
from extensions import bcrypt, db
from models import Hotel, Room, User


ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "123456"

HOTELS = [
    {"name": "Main Hotel", "location": "Karachi", "description": "City-center hotel for quick stays."},
    {"name": "Sea View Hotel", "location": "Karachi", "description": "Family-friendly hotel near the beach."},
]

# Sample rooms are attached to hotels after seed creates them.
ROOMS = [
    # Single
    {"room_type": "Single", "capacity": 1, "ac_type": "Non-AC", "price": 2200},
    {"room_type": "Single", "capacity": 1, "ac_type": "AC", "price": 3200},
    # Double
    {"room_type": "Double", "capacity": 2, "ac_type": "Non-AC", "price": 2800},
    {"room_type": "Double", "capacity": 2, "ac_type": "AC", "price": 4200},
    # Triple
    {"room_type": "Triple", "capacity": 4, "ac_type": "Non-AC", "price": 3500},
    {"room_type": "Triple", "capacity": 4, "ac_type": "AC", "price": 5500},
]


def main() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()

        # 1) Admin account
        admin = User.query.filter_by(email=ADMIN_EMAIL).first()
        if not admin:
            pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")
            admin = User(name="Admin", email=ADMIN_EMAIL, password=pw_hash, role="admin")
            db.session.add(admin)
            db.session.commit()
            print("Created admin user:", ADMIN_EMAIL)
        else:
            # Ensure role is correct even if user already existed.
            if admin.role != "admin":
                admin.role = "admin"
                db.session.commit()
                print("Updated existing user to admin:", ADMIN_EMAIL)

        # 2) Hotels
        if Hotel.query.count() == 0:
            for h in HOTELS:
                db.session.add(Hotel(**h))
            db.session.commit()
            print(f"Seeded {len(HOTELS)} hotels.")

        hotels = Hotel.query.order_by(Hotel.id.asc()).all()
        if not hotels:
            print("No hotels found; cannot seed rooms.")
            return

        # 3) Rooms
        existing_rooms = Room.query.count()
        if existing_rooms > 0:
            print(f"Rooms already exist ({existing_rooms}). Skipping room seed.")
            return

        # Split sample rooms across hotels for nicer admin demo.
        for idx, r in enumerate(ROOMS):
            hotel = hotels[idx % len(hotels)]
            db.session.add(Room(hotel_id=hotel.id, **r))
        db.session.commit()
        print(f"Seeded {len(ROOMS)} rooms.")


if __name__ == "__main__":
    main()
