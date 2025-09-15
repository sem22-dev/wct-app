import os
from dotenv import load_dotenv

load_dotenv()

# LiveKit Configuration
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET") 
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

# AI Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Validation
def validate_config():
    """Validate that all required environment variables are set"""
    missing = []
    if not LIVEKIT_API_KEY:
        missing.append("LIVEKIT_API_KEY")
    if not LIVEKIT_API_SECRET:
        missing.append("LIVEKIT_API_SECRET")
    if not LIVEKIT_URL:
        missing.append("LIVEKIT_URL")
    
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

# Validate on import
validate_config()
