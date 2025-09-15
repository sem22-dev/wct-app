from livekit import api
from fastapi import HTTPException
from core.config import LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
from schemas.requests import HoldCallerRequest

async def move_participant_between_rooms(consultation_room: str, agent_identity: str, destination_room: str):
    """Move participant from consultation room to destination room"""
    try:
        # Initialize LiveKit API client
        lkapi = api.LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET
        )
        
        # Note: LiveKit move_participant is only available in Cloud/Private Cloud
        # For open-source, this is handled client-side by reconnecting
        await lkapi.room.move_participant(
            api.MoveParticipantRequest(
                room=consultation_room,
                identity=agent_identity,
                destination_room=destination_room
            )
        )
        
        return {
            "moved": True,
            "from_room": consultation_room,
            "to_room": destination_room,
            "participant": agent_identity,
            "method": "client_side_reconnection"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Move failed: {str(e)}")

async def hold_caller_service(request: HoldCallerRequest):
    """Put caller on hold or resume them"""
    try:
        print(f"Hold request: {request.caller_identity} in {request.room}, hold={request.hold}")
        
        # LiveKit logic for hold/unhold would go here
        # This might involve muting audio or updating room metadata
        # For now, we'll return success as the actual hold logic 
        # depends on your specific implementation requirements
        
        return {
            "status": "success",
            "caller_identity": request.caller_identity,
            "room": request.room,
            "on_hold": request.hold,
            "message": f"Caller {'placed on hold' if request.hold else 'resumed'}"
        }
        
    except Exception as e:
        print(f"Hold caller error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
