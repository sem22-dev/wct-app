export interface TokenResponse {
  token: string;
  url: string;
  room: string;
  identity: string;
}

export interface TransferResponse {
  consultation_room: string;
  summary: string;
  original_room: string;
  caller_identity: string;
  agent_a_identity: string;
  consultation_url: string;
  status: string;
}

export async function getToken(room: string, identity: string, role: string = "participant"): Promise<TokenResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/token?room=${room}&identity=${identity}&role=${role}`);
  if (!response.ok) {
    throw new Error('Failed to get token');
  }
  return response.json();
}

export async function initiateTransfer(callerRoom: string, callerIdentity: string, agentAIdentity: string, context?: string): Promise<TransferResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      caller_room: callerRoom, 
      caller_identity: callerIdentity,
      agent_a_identity: agentAIdentity,
      context: context 
    })
  });
  if (!response.ok) {
    throw new Error('Failed to initiate transfer');
  }
  return response.json();
}

export async function completeTransfer(consultationRoom: string, agentBIdentity: string, destinationRoom: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/complete-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consultation_room: consultationRoom,
      agent_b_identity: agentBIdentity,
      destination_room: destinationRoom
    })
  });
  if (!response.ok) {
    throw new Error('Failed to complete transfer');
  }
  return response.json();
}

export async function holdCaller(callerIdentity: string, room: string, hold: boolean) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/hold-caller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
      },
      body: JSON.stringify({
        caller_identity: callerIdentity, 
        room: room,
        hold: hold
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Hold caller failed:', errorData);
      throw new Error(`Hold caller failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Hold caller request failed:', error);
    throw error;
  }
}
