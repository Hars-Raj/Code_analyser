# AI Code Analyser

AI Code Analyser is a full-stack web application that analyses source code using a hybrid pipeline combining **Semgrep static analysis** and **Google Gemini AI**. Semgrep performs deterministic security scanning and maps findings to OWASP Top 10 categories. Gemini then analyses what Semgrep missed — logical bugs, architectural issues, and maintainability concerns — before a second agent generates a refactored version of the code.

Originally built as a portfolio project, the long-term goal is to develop this into an educational platform that helps programmers improve their skills through iterative, AI-assisted feedback.

---

## Live Demo

https://code-analyser-bk91.onrender.com

> **Note:** The application is hosted on Render's free tier. The first visit after a period of inactivity may take **30–60 seconds** to load while the server wakes up.

---

## Features

- 🔬 **Semgrep static analysis** — deterministic security scanning with 500+ rules, no AI guessing
- 🤖 **Gemini AI analysis** — catches logical bugs, architectural issues, and edge cases Semgrep misses
- 🛡️ **OWASP Top 10 mapping** — every security finding is mapped to the relevant OWASP category with reference links
- 🚨 **Severity-based issue categorisation** — issues ranked as High, Medium, or Low with source attribution
- 📋 **Expandable accordion reports** — click any issue to see the full explanation, location, OWASP mapping, analysis engine, and rule ID
- 📊 **Code quality scores** — Understandability, Efficiency, and Maintainability rated out of 10
- ✏️ **Syntax-highlighted code editor** — powered by CodeMirror with Tomorrow Night theme
- 🔄 **Side-by-side refactor view** — original and refactored code displayed simultaneously for easy comparison
- 🌐 **Multi-language support** — Python, JavaScript, Java, C++, TypeScript
- 📱 **Responsive design** — scales across screen sizes from laptop to large monitor
- 🎨 **Dark mode UI** — code-editor aesthetic throughout

---

## Screenshots

### Landing Page
![Landing page](images/landing.png)

### Code Analysis
![Analysis output 1](images/analysis1.png)
![Analysis output 2](images/analysis2.png)

### Refactored Output
![Refactored output 1](images/refactored1.png)
![Refactored output 2](images/refactored2.png)

---

## How It Works

1. The user pastes code into the editor and selects a language.
2. The `/analyse` endpoint runs **Semgrep** and **Gemini in parallel**:
   - Semgrep performs static analysis, detecting security vulnerabilities and mapping each finding to OWASP Top 10 categories with rule IDs.
   - Gemini receives both the code and Semgrep's verified findings, adds educational explanations to Semgrep issues, and identifies additional problems Semgrep cannot detect — logical bugs, missing validation, resource leaks, architectural concerns.
3. The combined analysis is returned as structured JSON and displayed in the accordion interface, with each issue showing its source (Semgrep or Gemini), severity, OWASP mapping where applicable, and line location.
4. Users are encouraged to attempt fixes themselves before requesting a refactor.
5. When requested, Agent 2 receives both the original code and the full analysis to generate an improved version with a detailed change log.

---

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- [CodeMirror 5](https://codemirror.net/) — code editor with syntax highlighting
- [Prism.js](https://prismjs.com/) — syntax highlighting for refactored output

### Backend
- Python 3.11+
- [Flask](https://flask.palletsprojects.com/) — web framework
- [Flask-CORS](https://flask-cors.readthedocs.io/) — cross-origin request handling
- [python-dotenv](https://pypi.org/project/python-dotenv/) — environment variable management

### Security Analysis
- [Semgrep](https://semgrep.dev/) — static analysis engine with OWASP-mapped security rules
- Runs as a subprocess against a temporary file, returns structured JSON findings

### AI
- [Google Gemini API](https://ai.google.dev/) — `gemini-2.5-flash` model
- [google-genai](https://pypi.org/project/google-genai/) — official Python SDK

---

## Prerequisites

Before running this project locally, ensure you have:

- Python 3.11 or newer
- Git
- A modern web browser (Chrome, Brave, Firefox, Edge, Opera GX)
- A Google account with a Gemini API key

Generate a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey). Google provides a generous free tier suitable for personal projects and development.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Hars-Raj/Code_analyser.git
cd Code_analyser
```

### 2. Create a virtual environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r backend/requirements.txt
```

Semgrep is included in `requirements.txt` and installs automatically. No separate installation is required.

### 4. Configure environment variables

Inside the `backend/` folder, create a file named `.env` and add your API key:

```env
GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never commit your `.env` file. It is already included in `.gitignore`.

### 5. Run the application

```bash
cd backend
python app.py
```

Open your browser and navigate to:

```
http://localhost:5000
```

> **Note:** On first run, Semgrep will download and cache its rule registry. This takes 30–60 seconds. Subsequent runs are significantly faster.

---

## Project Structure

```
Code_Analyser/
│
├── backend/
│   ├── app.py                      # Flask application entry point
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── data/                       # Static reference data
│   │   ├── __init__.py
│   │   └── owasp.py                # OWASP category definitions
│   │
│   ├── routes/                     # API route handlers (thin layer)
│   │   ├── __init__.py
│   │   ├── analyse.py              # POST /analyse
│   │   └── refactor.py             # POST /refactor
│   │
│   ├── services/                   # Business logic
│   │   ├── __init__.py
│   │   ├── reviewer.py             # Orchestrates Semgrep + Gemini pipeline
│   │   ├── gemini.py               # Gemini API calls — Agent 1 and Agent 2
│   │   └── semgrep.py              # Semgrep subprocess runner and parser
│   │
│   └── prompts/                    # AI prompt templates
│       ├── __init__.py
│       ├── analyser_prompt.py      # Agent 1 — hybrid analysis prompt
│       └── refactorer_prompt.py    # Agent 2 — refactoring prompt
│
├── frontend/
│   ├── index.html                  # App structure
│   ├── style.css                   # Dark mode styling and responsive layout
│   └── script.js                   # UI logic, API calls, accordion behaviour
│
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the frontend |
| `POST` | `/analyse` | Runs Semgrep + Gemini pipeline — returns issues with OWASP mappings, scores, and summary |
| `POST` | `/refactor` | Runs Agent 2 — returns refactored code and per-issue change log |

**Request body for `/analyse`:**
```json
{
  "code": "your code here",
  "language": "python"
}
```

**Request body for `/refactor`:**
```json
{
  "code": "your original code here",
  "analysis": { ... }
}
```

**Example issue in `/analyse` response:**
```json
{
  "issue": "The user_id parameter is directly concatenated into the SQL query string, making it vulnerable to SQL injection.",
  "short_summary": "SQL Injection vulnerability due to string concatenation.",
  "severity": "High",
  "category": "Security",
  "source": "Semgrep",
  "location": { "start_line": 9, "end_line": 9 },
  "rule": "python.sqlalchemy.security.sqlalchemy-execute-raw-query",
  "owasp": [
    {
      "id": "A03:2021",
      "name": "Injection",
      "url": "https://owasp.org/Top10/A03_2021-Injection/"
    }
  ]
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key from AI Studio |

---

## Known Limitations

- Analysis takes 30–90 seconds depending on code complexity — Semgrep rule matching and Gemini reasoning both take time
- Semgrep's free tier rules cover common vulnerabilities but miss some patterns available in the commercial tier
- The Gemini free tier has rate limits — heavy usage may result in temporary 429 errors
- Refactored output quality depends on Gemini's response and may vary between runs
- Large files may hit output token limits on the free tier

---

## Roadmap

### Completed
- [x] Semgrep static analysis integration
- [x] OWASP Top 10 mapping on security findings
- [x] Hybrid Semgrep + Gemini analysis pipeline
- [x] Source attribution per issue (Semgrep vs Gemini)
- [x] Restructured backend architecture (routes / services / prompts)

### Planned
- [ ] PDF report export
- [ ] OSV dependency scanning from requirements.txt / package.json
- [ ] ZIP project upload for multi-file analysis
- [ ] Comparison agent — submit revised code and see what improved
- [ ] Progress tracking across multiple attempts
- [ ] User authentication and accounts
- [ ] Institution dashboard for bootcamps and universities
- [ ] Database integration via Supabase
- [ ] Dockerised deployment

---

## Contributing

This project is in active early development. If you find a bug or have a suggestion, feel free to open an issue or submit a pull request.

---

## License

This project is currently unlicensed. All rights reserved by the author.

---

## Author

**Raj Harsh**
GitHub: [github.com/Hars-Raj](https://github.com/Hars-Raj)

Built as a pre-university portfolio project while interning at an AI startup in Singapore.