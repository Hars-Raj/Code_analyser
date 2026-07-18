from flask import Blueprint, request, jsonify
from backend.services.reviewer import refactor_code
import os

# Define a Blueprint for the refactor route
refactor_bp = Blueprint("refactor", __name__)

# Define a route for code refactoring
@refactor_bp.route('/refactor', methods=['POST'])
def refactor():
    data = request.get_json()
    code = data.get('code')
    analysis_result = data.get('analysis')
    result = refactor_code(code, analysis_result, os.getenv("GEMINI_API_KEY"))
    return jsonify(result)