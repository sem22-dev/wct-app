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
class PhoneCallRequest(BaseModel):
    phone_number: str
    message: Optional[str] = "Hello! You are being connected to customer support."

class ConferenceCallRequest(BaseModel):
    phone_number: str
    conference_name: str

class PhoneTransferRequest(BaseModel):
    caller_room: str
    caller_identity: str
    agent_a_identity: str
    phone_number: str  # Agent B's phone number
    context: Optional[str] = None