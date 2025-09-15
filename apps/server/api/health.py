from fastapi import APIRouter
from core.config import LIVEKIT_API_KEY

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "livekit_configured": bool(LIVEKIT_API_KEY)}
