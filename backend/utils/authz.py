from __future__ import annotations

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import User


def admin_required(fn):
    """
    Middleware for admin-only APIs.

    Usage:
      @bp.get("/admin/dashboard")
      @admin_required
      def dashboard(): ...
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"message": "admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper

