from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from backend.routes.analyse import analyse_bp
from backend.routes.refactor import refactor_bp
import os

# Load environment variables from .env file
load_dotenv()

import subprocess
import threading

# Warm up Semgrep rules on startup
def warm_semgrep():
    """Pre-download Semgrep rules on startup so first user request isn't slow"""
    try:
        subprocess.run(
            ["semgrep", "--config", "p/security-audit", "--dry-run", "/tmp"],
            capture_output=True,
            timeout=120
        )
        print("Semgrep rules cached")
    except Exception as e:
        print("Semgrep warmup failed:", e)

# Run warmup in background so Flask starts immediately
threading.Thread(target=warm_semgrep, daemon=True).start()

# Initialize the Flask application
app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend",
    static_url_path="/static",
)
CORS(app)

app.register_blueprint(analyse_bp)
app.register_blueprint(refactor_bp)

# Define a route for the home page
@app.route('/')
def home():
    return render_template('index.html')


# Run the Flask application
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
