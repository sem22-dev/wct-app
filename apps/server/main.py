from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
from dotenv import load_dotenv
import uuid
from pydantic import BaseModel
from typing import Optional
from groq import Groq

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

class TransferRequest(BaseModel):
    caller_room: str
    caller_identity: str
    agent_a_identity: str
    context: Optional[str] = None

class MoveParticipantRequest(BaseModel):
    consultation_room: str
    agent_b_identity: str
    destination_room: str

class HoldCallerRequest(BaseModel):
    caller_identity: str
    room: str
    hold: bool


@app.get("/health")
async def health():
    return {"status": "ok", "livekit_configured": bool(LIVEKIT_API_KEY)}

@app.get("/token")
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

@app.post("/transfer")
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
    
@app.post("/disconnect-agent")
async def disconnect_agent(agent_identity: str, room: str):
    """Signal agent to disconnect and close tabs"""
    try:
        # In production, you could use WebSocket or Server-Sent Events
        # For demo, we'll use a simple flag system
        return {
            "status": "disconnect_requested",
            "message": f"Agent {agent_identity} should disconnect from {room}",
            "action": "close_tabs"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/complete-transfer")
async def complete_transfer(request: MoveParticipantRequest):
    """Complete warm transfer - Step 3: Move Agent B to main call"""
    try:
        # Initialize LiveKit API client
        room_service = api.RoomServiceClient(
            LIVEKIT_URL,
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET
        )
        
        # Move Agent B from consultation room to main call
        await room_service.move_participant(
            api.MoveParticipantRequest(
                room=request.consultation_room,
                identity=request.agent_b_identity,
                destination_room=request.destination_room
            )
        )
        
        return {
            "status": "transfer_complete",
            "message": f"Agent B moved to {request.destination_room}"
        }
    except Exception as e:
        print(f"Move participant error: {e}")
        # Fallback: return success so frontend can handle reconnection
        return {
            "status": "transfer_complete_manual",
            "message": "Agent B should manually join main room",
            "fallback": True
        }

@app.post("/hold-caller")
async def hold_caller(request: HoldCallerRequest):
    """Put caller on hold or resume them"""
    try:
        print(f"Hold request: {request.caller_identity} in {request.room}, hold={request.hold}")
        
        # Your LiveKit logic here to hold/unhold the caller
        # This might involve muting their audio or updating room metadata
        
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

async def generate_call_summary(context: str = None):
    """Generate AI summary using Groq API"""
    try:
        if not context:
            context = "Customer called about account login issues. Needs password reset assistance."

        groq_client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that creates concise call summaries for warm transfers. Keep it under 50 words and include key details for the next agent. Be professional and clear."
                },
                {
                    "role": "user",
                    "content": f"Create a warm transfer summary for this call context: {context}"
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=100,
            temperature=0.1
        )
        print("generated summary: ", chat_completion.choices[0].message.content)
        return chat_completion.choices[0].message.content
            
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Graceful fallback
        return f"Call Summary: {context} - Customer needs assistance and requires transfer to specialist agent."

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
