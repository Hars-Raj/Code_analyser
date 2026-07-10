from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from reviewer import analyse_code, refactor_code
import os

load_dotenv()

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend",
    static_url_path="/static",
)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyse', methods=['POST'])
def analyse():
    data = request.get_json()
    code = data.get('code')
    language = data.get('language')
    result = analyse_code(code, language, os.getenv("GEMINI_API_KEY"))
    return jsonify(result)

@app.route('/refactor', methods=['POST'])
def refactor():
    data = request.get_json()
    code = data.get('code')
    analysis_result = data.get('analysis')
    result = refactor_code(code, analysis_result, os.getenv("GEMINI_API_KEY"))
    return jsonify(result)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
