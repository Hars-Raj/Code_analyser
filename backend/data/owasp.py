"""
Official OWASP Top 10 reference information.

Used to attach educational information and official documentation
to security findings returned by Semgrep or Gemini.
"""

OWASP = {
    "2021": {
        "A01": {
            "name": "Broken Access Control",
            "url": "https://owasp.org/Top10/A01_2021-Broken_Access_Control/"
        },
        "A02": {
            "name": "Cryptographic Failures",
            "url": "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/"
        },
        "A03": {
            "name": "Injection",
            "url": "https://owasp.org/Top10/A03_2021-Injection/"
        },
        "A04": {
            "name": "Insecure Design",
            "url": "https://owasp.org/Top10/A04_2021-Insecure_Design/"
        },
        "A05": {
            "name": "Security Misconfiguration",
            "url": "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/"
        },
        "A06": {
            "name": "Vulnerable and Outdated Components",
            "url": "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/"
        },
        "A07": {
            "name": "Identification and Authentication Failures",
            "url": "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/"
        },
        "A08": {
            "name": "Software and Data Integrity Failures",
            "url": "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/"
        },
        "A09": {
            "name": "Security Logging and Monitoring Failures",
            "url": "https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/"
        },
        "A10": {
            "name": "Server-Side Request Forgery (SSRF)",
            "url": "https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/"
        },
    },

    "2025": {
        "A01": {
            "name": "Broken Access Control",
            "url": "https://owasp.org/Top10/A01_2025-Broken_Access_Control/"
        },
        "A02": {
            "name": "Cryptographic Failures",
            "url": "https://owasp.org/Top10/A02_2025-Cryptographic_Failures/"
        },
        "A03": {
            "name": "Injection",
            "url": "https://owasp.org/Top10/A03_2025-Injection/"
        },
        "A04": {
            "name": "Insecure Design",
            "url": "https://owasp.org/Top10/A04_2025-Insecure_Design/"
        },
        "A05": {
            "name": "Security Misconfiguration",
            "url": "https://owasp.org/Top10/A05_2025-Security_Misconfiguration/"
        },
        "A06": {
            "name": "Vulnerable and Outdated Components",
            "url": "https://owasp.org/Top10/A06_2025-Vulnerable_and_Outdated_Components/"
        },
        "A07": {
            "name": "Identification and Authentication Failures",
            "url": "https://owasp.org/Top10/A07_2025-Identification_and_Authentication_Failures/"
        },
        "A08": {
            "name": "Software and Data Integrity Failures",
            "url": "https://owasp.org/Top10/A08_2025-Software_and_Data_Integrity_Failures/"
        },
        "A09": {
            "name": "Security Logging and Monitoring Failures",
            "url": "https://owasp.org/Top10/A09_2025-Security_Logging_and_Monitoring_Failures/"
        },
        "A10": {
            "name": "Server-Side Request Forgery (SSRF)",
            "url": "https://owasp.org/Top10/A10_2025-Server-Side_Request_Forgery_%28SSRF%29/"
        },
    }
}



def get_owasp_info(reference: str):
    """
    Converts:
        'A03:2021 - Injection'

    into:

    {
        "id": "A03:2021",
        "name": "Injection",
        "url": "https://..."
    }
    """

    try:
        code, year = reference.split(" - ")[0].split(":")
        info = OWASP[year][code]

        return {
            "id": f"{code}:{year}",
            "name": info["name"],
            "url": info["url"]
        }

    except (KeyError, ValueError):
        return {
            "id": reference,
            "name": reference,
            "url": None
        }