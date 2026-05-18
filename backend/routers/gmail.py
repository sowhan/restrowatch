import os
from datetime import datetime, timezone
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from services.supabase_client import supabase
from services.gmail_client import get_auth_url, exchange_code_for_tokens, get_gmail_service
from services.gmail_parser import poll_gmail_for_reviews
from routers.auth import get_user_from_token

router = APIRouter()


@router.get("/auth-url")
async def get_gmail_auth_url():
    """Generate Google OAuth consent URL."""
    try:
        url = get_auth_url()
        return {"auth_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate auth URL: {str(e)}")


@router.get("/oauth-callback")
async def gmail_oauth_callback(code: str = Query(None)):
    """Handle Google OAuth callback."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if not code:
        return RedirectResponse(
            url=f"{frontend_url}/settings?gmail=error&reason={quote('Missing authorization code')}",
            status_code=302,
        )

    try:
        credentials = exchange_code_for_tokens(code)
        email = credentials.id_token.get("email", "unknown") if credentials.id_token else "unknown"
        return RedirectResponse(
            url=f"{frontend_url}/settings?gmail=connected&email={quote(email)}",
            status_code=302,
        )
    except Exception as e:
        return RedirectResponse(
            url=f"{frontend_url}/settings?gmail=error&reason={quote(str(e))}",
            status_code=302,
        )


@router.get("/poll")
async def trigger_poll(user: dict = Depends(get_user_from_token)):
    """Manually trigger Gmail poll."""
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can trigger Gmail poll")

    try:
        poll_gmail_for_reviews()
        return {"status": "success", "message": "Gmail poll completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Poll failed: {str(e)}")


@router.get("/status")
async def gmail_status(user: dict = Depends(get_user_from_token)):
    """Check Gmail connection status."""
    try:
        result = supabase.table("gmail_credentials").select(
            "refresh_token, token_expiry"
        ).limit(1).execute()
        connected = len(result.data) > 0
        credentials = result.data[0] if connected else {}
        token_expiry = credentials.get("token_expiry")
        has_refresh_token = bool(credentials.get("refresh_token"))
        token_valid = None
        if token_expiry:
            try:
                expiry_dt = datetime.fromisoformat(token_expiry.replace("Z", "+00:00"))
                token_valid = expiry_dt > datetime.now(timezone.utc)
            except Exception:
                token_valid = None

        can_read_mail = connected and get_gmail_service() is not None

        sync_result = supabase.table("gmail_sync").select("*").limit(1).execute()
        last_sync = sync_result.data[0].get("last_synced_at") if sync_result.data else None

        return {
            "connected": connected,
            "last_synced_at": last_sync,
            "token_expiry": token_expiry,
            "token_valid": token_valid,
            "has_refresh_token": has_refresh_token,
            "can_read_mail": can_read_mail,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
