from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from services.supabase_client import supabase

router = APIRouter()


def get_user_from_token(request: Request):
    """Extract and verify Supabase JWT from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.replace("Bearer ", "")

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id = str(user_response.user.id)

        user_data = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_data.data:
            raise HTTPException(status_code=403, detail="User profile not found")

        return {
            "id": user_id,
            "name": user_data.data[0].get("name"),
            "role": user_data.data[0].get("role"),
            "restaurant_id": user_data.data[0].get("restaurant_id"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.get("/verify")
async def verify_token(user: dict = Depends(get_user_from_token)):
    return {
        "authenticated": True,
        "user": user,
    }
