from fastapi import APIRouter, HTTPException, Query, Depends
from services.supabase_client import supabase
from services.sla_calculator import SLA_THRESHOLDS
from services.dashboard_stats import get_dashboard_overview_data
from routers.auth import get_user_from_token
from models.schemas import SLAConfig

router = APIRouter()


@router.get("/restaurants")
async def list_restaurants(user: dict = Depends(get_user_from_token)):
    result = supabase.table("restaurants").select("*").order("name").execute()
    return result.data or []


@router.get("/dashboard/overview")
async def get_dashboard_overview(user: dict = Depends(get_user_from_token)):
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can access dashboard overview")
    return get_dashboard_overview_data(include_rating_trend=True)


@router.get("/unmatched-emails")
async def list_unmatched_emails(user: dict = Depends(get_user_from_token)):
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can view unmatched emails")

    result = supabase.table("unmatched_emails").select("*").order(
        "created_at", desc=True
    ).execute()
    return result.data or []


@router.post("/unmatched-emails/{email_id}/assign")
async def assign_unmatched_email(
    email_id: str,
    restaurant_id: str = Query(...),
    user: dict = Depends(get_user_from_token),
):
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can assign emails")

    unmatched = supabase.table("unmatched_emails").select("*").eq(
        "id", email_id
    ).execute()

    if not unmatched.data:
        raise HTTPException(status_code=404, detail="Unmatched email not found")

    email = unmatched.data[0]

    # Create review from unmatched email
    supabase.table("reviews").insert({
        "restaurant_id": restaurant_id,
        "platform": email.get("platform", "unknown"),
        "rating": 3,
        "review_text": email.get("body", "")[:1000],
        "severity": "medium",
        "email_message_id": email.get("email_message_id"),
        "email_received_at": email.get("email_received_at"),
    }).execute()

    # Delete from unmatched
    supabase.table("unmatched_emails").delete().eq("id", email_id).execute()

    return {"status": "success", "message": "Email assigned and review created"}


@router.get("/sla-config")
async def get_sla_config(user: dict = Depends(get_user_from_token)):
    return SLAConfig(**SLA_THRESHOLDS)


@router.patch("/sla-config")
async def update_sla_config(
    config: SLAConfig,
    user: dict = Depends(get_user_from_token),
):
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can update SLA config")

    SLA_THRESHOLDS["critical"] = config.critical
    SLA_THRESHOLDS["high"] = config.high
    SLA_THRESHOLDS["medium"] = config.medium
    SLA_THRESHOLDS["low"] = config.low

    return {"status": "success", "config": SLA_THRESHOLDS}
