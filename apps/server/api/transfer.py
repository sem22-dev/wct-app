from fastapi import APIRouter, HTTPException
from schemas.requests import TransferRequest
from services.ai_service import generate_call_summary
import uuid

router = APIRouter()

@router.post("/transfer")
async def initiate_transfer(request: TransferRequest):
    """Initiate warm transfer - Step 1: Create consultation room"""
    try:
        # Create consultation room
        consultation_room = f"consult-{uuid.uuid4().hex[:8]}"
        
        # Generate AI summary
        ai_summary = await generate_call_summary(request.context or "")
        
        return {
            "consultation_room": consultation_room,
            "summary": ai_summary,
            "original_room": request.caller_room,
            "caller_identity": request.caller_identity,
            "agent_a_identity": request.agent_a_identity,
            "consultation_url": f"http://localhost:3000/agent-consultation?room={consultation_room}&summary={ai_summary}",
            "status": "consultation_created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
