from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import bcrypt, db, jwt
from routes.auth import bp as auth_bp
from routes.bookings import bp as bookings_bp
from routes.payments import bp as payments_bp
from routes.recommendation import bp as recommendation_bp
from routes.rooms import bp as rooms_bp
from routes.admin import bp as admin_bp
from routes.assistant import bp as assistant_bp
from utils.migrations import ensure_schema


def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    # Ensure instance folder exists (SQLite file lives here for local dev).
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=False)

    # Make auth failures obvious during development (helps debug 401s quickly).
    @jwt.unauthorized_loader
    def _missing_jwt(reason: str):
        return jsonify({"message": "Missing or invalid Authorization header", "detail": reason}), 401

    @jwt.invalid_token_loader
    def _invalid_jwt(reason: str):
        return jsonify({"message": "Invalid token", "detail": reason}), 401

    @jwt.expired_token_loader
    def _expired_jwt(jwt_header, jwt_payload):
        return jsonify({"message": "Token expired. Please login again."}), 401

    @jwt.revoked_token_loader
    def _revoked_jwt(jwt_header, jwt_payload):
        return jsonify({"message": "Token revoked. Please login again."}), 401

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    # APIs (exact paths as in the requirements)
    app.register_blueprint(auth_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(assistant_bp)

    with app.app_context():
        db.create_all()
        # Apply lightweight upgrades for SQLite schema changes.
        ensure_schema()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
