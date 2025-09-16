import { Device } from '@twilio/voice-sdk';

let twilioDevice: Device | null = null;

export async function initializeTwilioDevice(accessToken: string) {
  try {
    twilioDevice = new Device(accessToken, {
      logLevel: 1,
      codecPreferences: ['opus', 'pcmu'],
      // Configure edge locations for better connectivity
      edge: ['singapore', 'sydney', 'tokyo'],
      // Increase signaling timeout to 30 seconds
      maxCallSignalingTimeoutMs: 30000
    });
    
    // Enhanced error handling with reconnection
    twilioDevice.on('error', (error) => {
      console.error('❌ Twilio device error:', error);
      
      if (error.code === 31005) {
        console.log('🔄 Connection lost, attempting to reconnect...');
        
        // Wait 3 seconds then try to reconnect
        setTimeout(async () => {
          try {
            await twilioDevice.register();
            console.log('✅ Reconnected successfully');
          } catch (reconnectError) {
            console.error('❌ Reconnection failed:', reconnectError);
            alert('Connection lost. Please refresh the page and try again.');
          }
        }, 3000);
        
      } else if (error.code === 31000) {
        console.log('🔄 Unknown error, attempting device reinitialize...');
        // Reinitialize the entire device
        setTimeout(() => {
          initializeTwilioDevice(accessToken);
        }, 5000);
      }
    });
    
    // Handle successful registration
    twilioDevice.on('registered', () => {
      console.log('✅ Device registered successfully');
    });
    
    // Handle unregistration (connection lost)
    twilioDevice.on('unregistered', () => {
      console.log('⚠️ Device unregistered - connection lost');
    });
    
    await twilioDevice.register();
    console.log('✅ Twilio device initialized and registered');
    
    return twilioDevice;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio device:', error);
    throw error;
  }
}

export async function refreshTwilioToken(agentIdentity: string, conferenceName: string) {
  try {
    const response = await fetch('http://localhost:8000/twilio/web-join-conference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_identity: agentIdentity,
        conference_name: conferenceName
      })
    });
    
    const { access_token } = await response.json();
    
    if (twilioDevice) {
      await twilioDevice.updateToken(access_token);
      console.log('✅ Token refreshed successfully');
    }
    
    return access_token;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    throw error;
  }
}


export async function joinConferenceFromWeb(conferenceName: string) {
  if (!twilioDevice) {
    throw new Error('Twilio device not initialized');
  }
  
  try {
    // Make outbound call to conference
    const call = await twilioDevice.connect({
      params: {
        To: conferenceName,
        From: 'web-client'  
      }
    });
    
    console.log('Joined conference via web:', conferenceName);
    return call;
    
  } catch (error) {
    console.error('Failed to join conference:', error);
    throw error;
  }
}

export function disconnectFromConference() {
  if (twilioDevice) {
    twilioDevice.disconnectAll();
  }
}
