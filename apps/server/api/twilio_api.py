from fastapi import APIRouter, HTTPException, Request, Response
from schemas.requests import PhoneCallRequest, ConferenceCallRequest, PhoneTransferRequest
from services.twilio_service import twilio_service
from services.ai_service import generate_call_summary
import uuid
from core.config import TWILIO_ACCOUNT_SID, TWILIO_API_SECRET, TWILIO_API_KEY, TWILIO_APP_SID
from twilio.twiml.voice_response import VoiceResponse
from datetime import datetime
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

router = APIRouter()

@router.post("/call")
async def make_phone_call(request: PhoneCallRequest):
    """Make a direct phone call"""
    try:
        result = await twilio_service.make_call(
            to_number=request.phone_number,
            message=request.message
        )
        return {
            "status": "success",
            "message": f"Call initiated to {request.phone_number}",
            "call_details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conference")
async def create_conference_call(request: ConferenceCallRequest):
    """Create a conference call with a phone number"""
    try:
        result = await twilio_service.create_conference_call(
            to_number=request.phone_number,
            conference_name=request.conference_name
        )
        return {
            "status": "success", 
            "message": f"Conference call created: {request.conference_name}",
            "call_details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transfer-to-phone")
async def transfer_to_phone(request: PhoneTransferRequest):
    """Transfer call to a real phone number via Twilio"""
    try:
        # Generate AI summary
        ai_summary = await generate_call_summary(request.context or "")
        
        # Create unique conference name
        conference_name = f"transfer-{uuid.uuid4().hex[:8]}"
        
        # Call the phone number and connect to conference
        phone_call = await twilio_service.create_conference_call(
            to_number=request.phone_number,
            conference_name=conference_name
        )
        
        return {
            "status": "phone_transfer_initiated",
            "message": f"Calling {request.phone_number} for warm transfer",
            "conference_name": conference_name,
            "summary": ai_summary,
            "phone_call_details": phone_call,
            "instructions": f"Agent at {request.phone_number} will join conference '{conference_name}'"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/web-join-conference")
async def web_join_conference(request: dict):
    try:
        agent_identity = request["agent_identity"]
        conference_name = request.get("conference_name", "")
        
        # Ensure unique identity with role prefix
        if agent_identity.startswith('caller-'):
            # For callers, add 'voice-' prefix to distinguish from LiveKit identity
            twilio_identity = f"voice-{agent_identity}"
        elif agent_identity.startswith('agent-'):
            # For agents, add 'voice-' prefix
            twilio_identity = f"voice-{agent_identity}"
        else:
            # Fallback
            twilio_identity = f"voice-{agent_identity}"
            
        print(f"🎯 Creating token for identity: {twilio_identity}")
        
        # Create token with unique identity
        token = AccessToken(
            TWILIO_ACCOUNT_SID,
            TWILIO_API_KEY,
            TWILIO_API_SECRET,
            identity=twilio_identity,  # Use unique identity
            ttl=14400  # 4 hours
        )
        
        voice_grant = VoiceGrant(
            outgoing_application_sid=TWILIO_APP_SID,
            incoming_allow=True
        )
        token.add_grant(voice_grant)
        
        return {
            "access_token": token.to_jwt(),
            "identity": twilio_identity
        }
        
    except Exception as e:
        print(f"❌ Token creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bridge-to-conference") 
async def bridge_to_conference(request: dict):
    """Add caller to existing conference"""
    try:
        # This will add the LiveKit caller's phone to the conference
        # You'll need the caller's phone number for this
        caller_call = await twilio_service.create_conference_call(
            to_number=request["caller_phone"],  # Get from UI or user data
            conference_name=request["conference_name"]
        )
        
        return {
            "status": "caller_added_to_conference",
            "caller_call": caller_call
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conference-status")
async def conference_status_webhook(request: Request):
    """Handle Twilio conference status callbacks"""
    form_data = await request.form()
    
    event = form_data.get('StatusCallbackEvent')
    conference_name = form_data.get('ConferenceFriendlyName')
    participant_label = form_data.get('ParticipantLabel')
    
    # Log the event
    print(f"Conference Event: {event} in {conference_name} for {participant_label}")

    
    return {"status": "received"}

@router.post("/voice-webhook")
async def voice_webhook(request: Request):
    """Handle TwiML requests from web clients"""
    try:
        form_data = await request.form()
        to = form_data.get('To', '')
        from_param = form_data.get('From', '')
        
        print(f"🎯 Webhook called: To={to}, From={from_param}")
        
        response = VoiceResponse() 
        
        # Handle web client connecting to conference
        if to and to.startswith('transfer-'):
            print(f"✅ Connecting web client to conference: {to}")
            response.say("Connecting you to the conference.", voice="alice")
            
            dial = response.dial()
            dial.conference(to, 
                           start_conference_on_enter=True,
                           end_conference_on_exit=False,
                           beep=False,
                           wait_url="",  # No hold music for web client
                           max_participants=10)
        else:
            # Default response
            response.say("Welcome to the voice application.", voice="alice")
        
        twiml_str = str(response)
        print(f"📤 Returning TwiML: {twiml_str}")
        
        return Response(content=twiml_str, media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()  # Print full error for debugging
        
        # Always return valid TwiML even on error
        error_response = VoiceResponse()
        error_response.say("There was an error connecting to the conference. Please try again.", voice="alice")
        return Response(content=str(error_response), media_type="application/xml")

@router.get("/webhook-health")
async def webhook_health():
    """Health check for webhook connectivity"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@router.post("/signal-caller-join")
async def signal_caller_join(request: dict):
    """Signal the caller to join Twilio conference"""
    try:
        room_name = request.get("room_name")
        conference_name = request.get("conference_name") 
        message = request.get("message")
        
        # Here we could use WebSocket, Server-Sent Events, or polling
        # For simplicity, we'll store the signal in a simple in-memory dict
        # In production, use Redis or a proper message queue
        
        if not hasattr(signal_caller_join, 'signals'):
            signal_caller_join.signals = {}
            
        signal_caller_join.signals[room_name] = {
            'conference_name': conference_name,
            'message': message,
            'timestamp': datetime.now()
        }
        
        return {
            "status": "signal_sent",
            "room": room_name,
            "conference": conference_name,
            "message": message
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-caller-signal/{room_name}")
async def check_caller_signal(room_name: str):
    """Check if caller should join Twilio conference"""
    try:
        if hasattr(signal_caller_join, 'signals') and room_name in signal_caller_join.signals:
            signal = signal_caller_join.signals[room_name]
            # Clear the signal after retrieving it
            del signal_caller_join.signals[room_name]
            return signal
        
        return {"message": "no_signal"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
