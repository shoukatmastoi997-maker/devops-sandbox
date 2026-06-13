from __future__ import annotations

import os


class Config:
    """
    Centralized config so the project is easy to understand and defend in viva.
    Environment variables keep secrets out of code.
    """

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///hotel_reservation.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")

    # Comma-separated list (e.g. "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

    # OpenAI (optional). If not provided, the app falls back to a simple rule-based assistant.
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()
