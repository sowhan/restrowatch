from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from services.supabase_client import supabase
from services.gmail_client import get_auth_url, exchange_code_for_tokens
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
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        credentials = exchange_code_for_tokens(code)
        return {
            "status": "success",
            "message": "Gmail connected successfully",
            "email": credentials.id_token.get("email", "unknown") if credentials.id_token else "unknown",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth failed: {str(e)}")


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
        result = supabase.table("gmail_credentials").select("*").limit(1).execute()
        connected = len(result.data) > 0

        sync_result = supabase.table("gmail_sync").select("*").limit(1).execute()
        last_sync = sync_result.data[0].get("last_synced_at") if sync_result.data else None

        return {
            "connected": connected,
            "last_synced_at": last_sync,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
