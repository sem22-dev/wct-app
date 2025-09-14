from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LiveKit configuration
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

if not all([LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL]):
    raise Exception("Missing LiveKit environment variables")

@app.get("/health")
async def health():
    return {"status": "ok", "livekit_configured": bool(LIVEKIT_API_KEY)}

@app.get("/token")
async def get_token(room: str, identity: str, role: str = "participant"):
    """Generate LiveKit access token for room connection"""
    try:
        # Define permissions based on role
        permissions = {
            "roomJoin": True,
            "roomCreate": False,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True,
        }
        
        if role == "agent":
            permissions["canPublishData"] = True
            permissions["canUpdateOwnMetadata"] = True

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(identity) \
            .with_name(f"{role.title()} {identity}") \
            .with_grants(api.VideoGrants(
                room_join=permissions["roomJoin"],
                room=room,
                can_publish=permissions["canPublish"],
                can_subscribe=permissions["canSubscribe"],
                can_publish_data=permissions["canPublishData"]
            ))

        return {
            "token": token.to_jwt(),
            "url": LIVEKIT_URL,
            "room": room,
            "identity": identity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transfer")
async def initiate_transfer(caller_room: str, caller_identity: str):
    """Initiate warm transfer - create consultation room and generate summary"""
    try:
        # Create new room for consultation
        consultation_room = f"consult-{uuid.uuid4().hex[:8]}"
        
        # Mock call summary (replace with real transcript processing)
        mock_summary = f"Call Summary: Caller {caller_identity} from {caller_room} needs assistance with account issues. Customer seems frustrated but cooperative. Requires account verification and password reset."
        
        return {
            "consultation_room": consultation_room,
            "summary": mock_summary,
            "original_room": caller_room,
            "caller_identity": caller_identity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

