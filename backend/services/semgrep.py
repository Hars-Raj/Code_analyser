import subprocess
import tempfile
import json
import os
from backend.data.owasp import get_owasp_info


def process_semgrep_findings(findings):

    severity_map = {
        "ERROR": "High",
        "WARNING": "Medium",
        "INFO": "Low"
    }

    processed_findings = []

    for index, finding in enumerate(findings.get("results", []), start=1):

        processed_findings.append({

            "id": f"SEC-{index:03}",

            "short_summary": "",

            "issue": finding.get("extra", {}).get(
                "message",
                "No message provided"
            ),

            "severity": severity_map.get(
                finding.get("extra", {}).get("severity"),
                "Low"
            ),

            "category": "Security",

            "source": "Semgrep",

            "location": {
                "start_line": finding.get("start", {}).get("line"),
                "end_line": finding.get("end", {}).get("line")
            },

            "rule": finding.get("check_id"),

            "owasp": [
                get_owasp_info(ref)
                for ref in finding.get("extra", {})
                                 .get("metadata", {})
                                 .get("owasp", [])
            ]

        })

    return processed_findings


def run_semgrep(code, language):
    suffix = {
        'python': '.py',
        'javascript': '.js',
        'java': '.java',
        'cpp': '.cpp',
        'typescript': '.ts'
    }.get(language, '.py')

    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix=suffix,
        delete=False,
        encoding='utf-8'
    ) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [
                "semgrep",
                "--json",
                "--config", "auto",
                "--no-git-ignore",
                tmp_path
            ],
            capture_output=True,
            text=True,
            timeout=120,
            encoding='utf-8',
            errors='replace'
        )

        findings = json.loads(result.stdout)
        return process_semgrep_findings(findings)

    except subprocess.TimeoutExpired:
        print("Semgrep timed out")
        return []
    except json.JSONDecodeError as e:
        print("JSON parse error:", e)
        print("Raw stdout:", repr(result.stdout[:300]))
        return []
    finally:
        os.unlink(tmp_path)

