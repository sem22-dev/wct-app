from fastapi import APIRouter, HTTPException
from schemas.requests import MoveParticipantRequest, HoldCallerRequest
from services.livekit_service import move_participant_between_rooms, hold_caller_service

router = APIRouter()

@router.post("/complete-transfer")
async def complete_transfer(request: MoveParticipantRequest):
    """Complete warm transfer - Step 3: Move Agent B to main call"""
    try:
        result = await move_participant_between_rooms(
            request.consultation_room,
            request.agent_b_identity, 
            request.destination_room
        )
        
        return {
            "status": "transfer_complete",
            "message": f"Agent B moved to {request.destination_room}",
            "details": result
        }
    except Exception as e:
        print(f"Move participant error: {e}")
        return {
            "status": "transfer_complete_manual",
            "message": "Agent B should manually join main room",
            "fallback": True
        }

@router.post("/hold-caller")
async def hold_caller(request: HoldCallerRequest):
    """Put caller on hold or resume them"""
    try:
        result = await hold_caller_service(request)
        return result
    except Exception as e:
        print(f"Hold caller error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disconnect-agent")
async def disconnect_agent(agent_identity: str, room: str):
    """Signal agent to disconnect and close tabs"""
    try:
        return {
            "status": "disconnect_requested",
            "message": f"Agent {agent_identity} should disconnect from {room}",
            "action": "close_tabs"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
