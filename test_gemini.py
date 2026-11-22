import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("API key not found!")
    exit()

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents="Introduce yourself as CampusAssist AI."
)

print(response.text)

client.close()