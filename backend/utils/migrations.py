from __future__ import annotations

"""
Beginner-friendly lightweight migrations.

Why not Alembic?
- Alembic is the "proper" production tool, but adds learning overhead.
- For a Final Year Project demo, we keep it simple and deterministic.

This module upgrades the SQLite schema in-place when the app starts.
"""

from sqlalchemy import text

from extensions import db


def ensure_schema() -> None:
    """
    Apply small schema upgrades safely.
    - Adds `users.role`
    - Creates `hotels`
    - Adds `rooms.hotel_id` (and back-fills existing rooms to default hotel)
    - Adds extra questionnaire columns on `preferences`
    """
    with db.engine.begin() as conn:
        tables = {
            r[0]
            for r in conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            ).fetchall()
        }

        if "users" in tables:
            user_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
            if "role" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"))

        # Hotels table
        if "hotels" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE hotels (
                      id INTEGER PRIMARY KEY,
                      name TEXT NOT NULL,
                      location TEXT NOT NULL,
                      description TEXT NOT NULL DEFAULT ''
                    )
                    """
                )
            )

        # Ensure a default hotel exists (id=1) so older room rows can be linked.
        existing_default = conn.execute(text("SELECT id FROM hotels WHERE id = 1")).fetchone()
        if not existing_default:
            conn.execute(
                text("INSERT INTO hotels (id, name, location, description) VALUES (1, 'Main Hotel', 'Karachi', '')")
            )

        # Rooms.hotel_id
        if "rooms" in tables:
            room_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(rooms)")).fetchall()}
            if "hotel_id" not in room_cols:
                conn.execute(text("ALTER TABLE rooms ADD COLUMN hotel_id INTEGER"))
                conn.execute(text("UPDATE rooms SET hotel_id = 1 WHERE hotel_id IS NULL"))

        # Preferences extra columns (safe ALTER TABLE ADD COLUMN for SQLite)
        if "preferences" in tables:
            pref_cols = {r[1] for r in conn.execute(text("PRAGMA table_info(preferences)")).fetchall()}
            if "budget_strictness" not in pref_cols:
                conn.execute(text("ALTER TABLE preferences ADD COLUMN budget_strictness TEXT"))
            if "comfort_priority" not in pref_cols:
                conn.execute(text("ALTER TABLE preferences ADD COLUMN comfort_priority TEXT"))
