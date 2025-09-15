from fastapi import APIRouter, HTTPException
from livekit import api
from core.config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

router = APIRouter()

@router.get("/token")
async def get_token(room: str, identity: str, role: str = "participant"):
    """Generate LiveKit access token for room connection"""
    try:
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
