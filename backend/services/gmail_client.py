import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from services.supabase_client import supabase
from datetime import datetime, timezone, timedelta

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET")
GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/gmail/oauth-callback")
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def get_gmail_service():
    """Get authenticated Gmail service."""
    creds = _get_stored_credentials()
    if not creds:
        return None

    if creds.expired and creds.refresh_token:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        try:
            creds.refresh(Request())
            _store_credentials(creds)
        except Exception as e:
            print(f"[GMAIL] Token refresh failed: {e}")
            return None

    return build("gmail", "v1", credentials=creds)


def get_auth_url():
    """Generate Google OAuth consent URL."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GMAIL_CLIENT_ID,
                "client_secret": GMAIL_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GMAIL_REDIRECT_URI],
            }
        },
        scopes=GMAIL_SCOPES,
        redirect_uri=GMAIL_REDIRECT_URI,
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def exchange_code_for_tokens(authorization_code: str):
    """Exchange OAuth code for tokens."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GMAIL_CLIENT_ID,
                "client_secret": GMAIL_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GMAIL_REDIRECT_URI],
            }
        },
        scopes=GMAIL_SCOPES,
        redirect_uri=GMAIL_REDIRECT_URI,
    )

    flow.fetch_token(code=authorization_code)
    credentials = flow.credentials

    _store_credentials(credentials)
    return credentials


def _get_stored_credentials():
    """Retrieve stored OAuth credentials from Supabase."""
    try:
        result = supabase.table("gmail_credentials").select("*").limit(1).execute()
        if not result.data:
            return None

        data = result.data[0]
        return Credentials(
            token=data.get("access_token"),
            refresh_token=data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GMAIL_CLIENT_ID,
            client_secret=GMAIL_CLIENT_SECRET,
            scopes=GMAIL_SCOPES,
            expiry=data.get("token_expiry"),
        )
    except Exception as e:
        print(f"[GMAIL] Error loading credentials: {e}")
        return None


def _store_credentials(credentials):
    """Store OAuth credentials in Supabase."""
    try:
        token_data = {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
        }

        existing = supabase.table("gmail_credentials").select("id").limit(1).execute()
        if existing.data:
            supabase.table("gmail_credentials").update(token_data).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            supabase.table("gmail_credentials").insert(token_data).execute()
    except Exception as e:
        print(f"[GMAIL] Error storing credentials: {e}")


def get_last_sync_time():
    """Get last sync timestamp from Supabase."""
    try:
        result = supabase.table("gmail_sync").select("*").limit(1).execute()
        if result.data:
            return result.data[0].get("last_synced_at")
    except Exception:
        pass
    return None


def update_sync_time():
    """Update sync timestamp in Supabase."""
    try:
        existing = supabase.table("gmail_sync").select("id").limit(1).execute()
        now = datetime.now(timezone.utc).isoformat()
        if existing.data:
            supabase.table("gmail_sync").update({
                "last_synced_at": now
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("gmail_sync").insert({
                "last_history_id": "0",
                "last_synced_at": now
            }).execute()
    except Exception as e:
        print(f"[GMAIL] Error updating sync time: {e}")
