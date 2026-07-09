# Call the Google GenAI API
from google import genai
from google.genai import types  
# Call dotenv to load environment variables
from dotenv import load_dotenv
import os
import json
# Call Prompts
from prompts.analyser_prompt import ANALYSER_PROMPT
from prompts.refactorer_prompt import REFACTORER_PROMPT

load_dotenv()

def analyse_code(code, language, api_key):
    """Analyzes the given code using the Google GenAI API."""
    # Initialize the GenAI client
    client = genai.Client(api_key=api_key)

    # Create a request to analyze the code
    prompt = ANALYSER_PROMPT.format(code=code.strip(), language=language)

    response = client.models.generate_content(
        # Use the Gemini 2.5 model for code analysis
        model="gemini-2.5-flash",
        # Provide the prompt to the model
        contents=prompt,
        # Set the temperature to control the randomness of the output
        config= types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=2048,

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


api_key = os.getenv("GEMINI_API_KEY")
