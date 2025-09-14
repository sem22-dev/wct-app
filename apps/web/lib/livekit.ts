export interface TokenResponse {
  token: string;
  url: string;
  room: string;
  identity: string;
}

export async function getToken(room: string, identity: string, role: string = "participant"): Promise<TokenResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/token?room=${room}&identity=${identity}&role=${role}`);
  if (!response.ok) {
    throw new Error('Failed to get token');
  }
  return response.json();
}

export async function initiateTransfer(callerRoom: string, callerIdentity: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caller_room: callerRoom, caller_identity: callerIdentity })
  });
  if (!response.ok) {
    throw new Error('Failed to initiate transfer');
  }
  return response.json();
}
