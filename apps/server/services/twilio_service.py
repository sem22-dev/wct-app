from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from core.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class TwilioService:
    def __init__(self):
        self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        self.from_number = TWILIO_PHONE_NUMBER
    
    async def make_call(self, to_number: str, message: str = "Hello! You are being connected to a customer support agent."):
        """Make an outbound call to a phone number"""
        try:
            # Create TwiML to say the message
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say voice="alice">{message}</Say>
                <Pause length="1"/>
                <Say voice="alice">Please hold while we connect you to the call.</Say>
            </Response>"""
            
            call = self.client.calls.create(
                twiml=twiml,
                to=to_number,
                from_=self.from_number
            )
            
            logger.info(f"Call initiated: {call.sid} to {to_number}")
            return {
                "call_sid": call.sid,
                "to": to_number,
                "from": self.from_number,
                "status": "initiated"
            }
            
        except Exception as e:
            logger.error(f"Failed to make call to {to_number}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Call failed: {str(e)}")
    
    async def create_conference_call(self, to_number: str, conference_name: str):
        try:
            # Enhanced TwiML with status callbacks
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say voice="alice">You are being connected to a support conference.</Say>
                <Dial>
                    <Conference 
                        startConferenceOnEnter="true" 
                        endConferenceOnExit="false"
                        statusCallback="http://your-ngrok-url.ngrok.io/twilio/conference-status"
                        statusCallbackEvent="start join leave end"
                    >
                        {conference_name}
                    </Conference>
                </Dial>
            </Response>"""
            
            call = self.client.calls.create(
                twiml=twiml,
                to=to_number,
                from_=self.from_number
            )
            
            return {
                "call_sid": call.sid,
                "conference_name": conference_name,
                "to": to_number,
                "status": "conference_call_initiated"
            }
            
        except Exception as e:
            logger.error(f"Failed to create conference call: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Conference call failed: {str(e)}")
    
    def generate_conference_twiml(self, conference_name: str):
        """Generate TwiML for joining a conference"""
        response = VoiceResponse()
        response.say("Welcome to the support conference.", voice="alice")
        dial = response.dial()
        dial.conference(conference_name, 
                       start_conference_on_enter=True,
                       end_conference_on_exit=False)
        return str(response)
    
    def generate_web_conference_twiml(self, conference_name: str):
        """Generate TwiML for web client to join conference"""
        response = VoiceResponse()
        response.say("Connecting you to the conference.", voice="alice")
        
        dial = response.dial()
        dial.conference(conference_name, 
                    start_conference_on_enter=True,
                    end_conference_on_exit=False,
                    beep=False)
        
        return str(response)


# Create global instance
twilio_service = TwilioService()
