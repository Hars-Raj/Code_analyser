from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from routes.analyse import analyse_bp
from routes.refactor import refactor_bp
import os

# Load environment variables from .env file
load_dotenv()

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
