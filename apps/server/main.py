from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api import health, auth, transfer, agent, twilio_api

load_dotenv()

app = FastAPI(
    title="Warm Call Transfer API",
    description="LiveKit-based warm call transfer system with AI summaries",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, tags=["auth"]) 
app.include_router(transfer.router, tags=["transfer"])
app.include_router(agent.router, tags=["agent"])
app.include_router(twilio_api.router, prefix="/twilio", tags=["twilio"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
