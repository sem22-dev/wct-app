# Warm Call Transfer System

Seamless voice handoffs between web customers and phone or web agents using **LiveKit**, **Twilio Voice**, and **FastAPI**.

## 🌟 Features

* **Browser-to-browser calls** with LiveKit WebRTC
* **Warm transfers** to either:

  * **Phone specialists** via Twilio Voice
  * **Agent B (LiveKit)** for internal escalation
* **Real-time signaling & conference management** with FastAPI
* **AI-powered call summaries** (Groq API)
* **Role-based UI** (Caller, Agent A, Agent B)
* **Call controls** (hold, mute, transfer)
* **Cross-platform & secure** with proper auth & tokens

## 🏗️ System Architecture

The system consists of three main components:

* **web:** Next.js app with LiveKit and Twilio JS SDK integration
* **server:** FastAPI REST API with modular architecture
* **External APIs:** LiveKit for real-time audio, Twilio for phone bridging, Groq for AI summaries

## 📦 Prerequisites

* **Python 3.10+**
* **Node.js 16+** and npm/yarn
* **Twilio account** with Programmable Voice
* **LiveKit account** with API credentials
* **Groq API key** (optional)
* **ngrok** or similar tunneling service for webhook testing

## 🚀 Backend Setup

```bash
git clone https://github.com/sem22-dev/wct-app.git
cd wct-app/apps/server

python -m venv venv
source venv/bin/activate  # Linux/macOS
# or venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

Create `.env` file in `apps/server`:

```env
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret
TWILIO_APP_SID=your_twiml_application_sid
TWILIO_PHONE_NUMBER=+1234567890

GROQ_API_KEY=your_groq_api_key
```

Run server:

```bash
uvicorn main:app --reload --port 8000
```

Backend available at: `http://localhost:8000` → Docs: `http://localhost:8000/docs`

## 🎨 Frontend Setup

```bash
cd ../web
npm install   # or yarn install
```

Create `.env.local` in frontend:

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev   # or yarn dev
```

Frontend at: `http://localhost:3000`

## 📱 Usage Instructions

### Start Roles

* **Caller:** [http://localhost:3000/caller](http://localhost:3000/caller)
* **Agent A:** [http://localhost:3000/agent-a](http://localhost:3000/agent-a)

Both join the same support room to begin.

---

### 🔀 Transfer Options

#### Transfer to Phone (Twilio)

1. Agent A clicks **“Transfer to Phone”**
2. Enter Agent B’s phone number
3. Agent B’s phone rings with hold music
4. Agent A joins consultation via web → briefs Agent B
5. Agent A clicks **“Add Caller to Conference”**
6. Caller accepts → joins 3-way conference
7. Agent A exits → Caller + Agent B continue

#### Transfer to Agent B (LiveKit)

1. Agent A clicks **“Transfer to Agent B”**
2. A **consultation room** opens
3. Agent A & Agent B connect → Agent A briefs summary
4. Agent B acknowledges & takes over main call
5. Agent A leaves → Caller + Agent B continue

---

## 🔧 Configuration Details

### Twilio Setup

1. Buy a phone number in Twilio Console
2. Create **API Key/Secret** for JWT generation
3. Create a **TwiML App** with webhook URL (`/twilio/voice-webhook`)
4. Configure webhook endpoint in FastAPI

### LiveKit Setup

1. Create project at [livekit.io](https://livekit.io)
2. Generate **API Key/Secret**
3. Note WebSocket URL (e.g. `wss://your-project.livekit.cloud`)

### ngrok Setup

```bash
npm install -g ngrok
ngrok http 8000
```

Use ngrok HTTPS URL in Twilio TwiML App config.

---

## 🐛 Troubleshooting

* **Twilio WebSocket Errors (1005/1006):** Check TwiML App URL, ngrok running, and correct API Key/Secret.
* **Application Error:** Webhook not returning valid TwiML → check FastAPI logs.
* **No Audio:** Check mic permissions, token grants, and matching conference names.
* **CORS Issues:** Verify CORS middleware & frontend URL in `allow_origins`.

Debug:

```bash
curl http://localhost:8000/health
curl -X POST "http://localhost:8000/twilio/voice-webhook" -d "To=test&From=test"
```

---

## 📁 Project Structure

```
wct-app/
├── apps/
│   ├── server/                 # FastAPI Backend
│   │   ├── api/               # API routers
│   │   │   ├── health.py      # Health check endpoints
│   │   │   ├── auth.py        # LiveKit authentication
│   │   │   ├── transfer.py    # Transfer coordination
│   │   │   ├── agent.py       # Agent management
│   │   │   └── twilio_api.py  # Twilio voice integration
│   │   ├── core/              # Core configuration
│   │   ├── services/          # Business logic
│   │   ├── schemas/           # Pydantic models
│   │   └── main.py            # FastAPI app
│   └── web/                   # Next.js Frontend
│       ├── app/               # App router pages
│       ├── components/        # React components
│       ├── lib/               # Utility libraries
│       └── public/            # Static assets
└── README.md
```

---

## 🔄 API Endpoints

**Core**

* `GET /health` → Health check
* `GET /token` → Generate LiveKit token
* `POST /transfer` → Initiate warm transfer
* `POST /complete-transfer` → Complete transfer

**Twilio**

* `POST /twilio/voice-webhook` → Handle Twilio voice calls
* `POST /twilio/transfer-to-phone` → Initiate phone transfer
* `POST /twilio/web-join-conference` → Join conference from browser
* `POST /twilio/signal-caller-join` → Signal caller to join conference

---