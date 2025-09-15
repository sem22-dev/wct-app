from pydantic import BaseModel
from typing import Optional

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
