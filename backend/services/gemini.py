# Call the Google GenAI API
from google import genai
from google.genai import types  
import json
# Call Prompts
from backend.prompts.analyser_prompt import ANALYSER_PROMPT
from backend.prompts.refactorer_prompt import REFACTORER_PROMPT



def analyse_code(code, language, api_key, semgrep_findings):
    """Analyzes the given code using the Google GenAI API."""
    # Initialize the GenAI client
    client = genai.Client(api_key=api_key)

    # Create a request to analyze the code
    prompt = ANALYSER_PROMPT.format(code=code.strip(), language=language, semgrep_findings=json.dumps(semgrep_findings))

    response = client.models.generate_content(
        # Use the Gemini 2.5 model for code analysis
        model="gemini-2.5-flash",
        # Provide the prompt to the model
        contents=prompt,
        # Set the temperature to control the randomness of the output
        config= types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=4096,

            # Force the output to always be valid JSON
            response_mime_type="application/json",
    
            # Give the model a persistent role/personality
            system_instruction="You are an expert Senior Python developer",
            )
        )

    # Extract the analysis result from the response
    result = json.loads(response.text)
    return result


def refactor_code(code, analysis_result, api_key):
    """Refactors the given code using the Google GenAI API and analyse_code output"""
    # Initialize the GenAI client
    client = genai.Client(api_key=api_key)

    # Create a request to analyze the code
    prompt = REFACTORER_PROMPT.format(code=code.strip(), analysis=json.dumps(analysis_result))

    response = client.models.generate_content(
        # Use the Gemini 2.5 model for code analysis
        model="gemini-2.5-flash",
        # Provide the prompt to the model
        contents=prompt,
        # Set the temperature to control the randomness of the output
        config= types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=16000,

            # Force the output to always be valid JSON
            response_mime_type="application/json",
    
            # Give the model a persistent role/personality
            system_instruction="You are an expert Senior Python developer",
            )
        )
    

    # Extract the analysis result from the response
    result = json.loads(response.text)
    return result

