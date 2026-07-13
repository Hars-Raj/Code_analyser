from backend.services.gemini import (
    analyse_code as gemini_analyse,
    refactor_code as gemini_refactor,
)
from backend.services.semgrep import run_semgrep


def analyse_code(code, language, api_key):
    """Analyzes the given code using the Google GenAI API and Semgrep."""
    # Run Semgrep analysis
    semgrep_findings = run_semgrep(code, language)

    # Run Gemini analysis
    gemini_findings = gemini_analyse(code, language, api_key, semgrep_findings)
    return gemini_findings

def refactor_code(code, analysis_result, api_key):
    return gemini_refactor(code, analysis_result, api_key)

