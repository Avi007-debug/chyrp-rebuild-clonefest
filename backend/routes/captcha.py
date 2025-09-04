from flask import Blueprint, jsonify, request, session
import random

captcha_bp = Blueprint("captcha", __name__)

# Generate a new math captcha
@captcha_bp.route("/new", methods=["GET"])
def new_captcha():
    a, b = random.randint(1, 9), random.randint(1, 9)
    session["captcha_answer"] = str(a + b)
    return jsonify({"question": f"{a} + {b} = ?", "captcha_id": "default"})

# Verify captcha answer
@captcha_bp.route("/verify", methods=["POST"])
def verify_captcha():
    data = request.get_json()
    answer = data.get("answer")
    correct = session.get("captcha_answer")

    if correct and str(answer) == correct:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid captcha"}), 400
