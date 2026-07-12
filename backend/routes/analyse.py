from flask import Blueprint, request, jsonify
from services.reviewer import analyse_code
import os

# Define a Blueprint for the analyse route
analyse_bp = Blueprint("analyse", __name__)

# Define a route for code analysis
@analyse_bp.route('/analyse', methods=['POST'])
def analyse():
    data = request.get_json()
    code = data.get('code')
    language = data.get('language')
    result = analyse_code(code, language, os.getenv("GEMINI_API_KEY"))
    return jsonify(result)