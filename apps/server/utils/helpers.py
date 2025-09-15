# Utility functions can go here as the project grows

def format_room_name(prefix: str) -> str:
    """Format room name with prefix"""
    import uuid
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

def validate_identity(identity: str) -> bool:
    """Validate participant identity format"""
    return bool(identity and len(identity) > 3)
