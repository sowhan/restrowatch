from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timezone, timedelta
from services.supabase_client import supabase
from services.sla_calculator import SLA_THRESHOLDS
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

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # Total reviews today
    total_result = supabase.table("reviews").select("id", count="exact").gte(
        "created_at", today_start.isoformat()
    ).execute()
    total_reviews = total_result.count or 0

    # Critical count (open)
    critical_result = supabase.table("reviews").select("id", count="exact").eq(
        "severity", "critical"
    ).in_("status", ["open", "in_progress"]).execute()
    critical_count = critical_result.count or 0

    # Resolved today
    resolved_result = supabase.table("reviews").select("id", count="exact").eq(
        "status", "resolved"
    ).gte("resolved_at", today_start.isoformat()).execute()
    resolved_today = resolved_result.count or 0

    # Avg response time (first_action_at - detected_at)
    actioned = supabase.table("reviews").select(
        "detected_at, first_action_at"
    ).not_.is_("first_action_at", "null").execute()

    avg_response = 0
    if actioned.data:
        times = []
        for r in actioned.data:
            if r.get("detected_at") and r.get("first_action_at"):
                d1 = datetime.fromisoformat(r["detected_at"].replace("Z", "+00:00"))
                d2 = datetime.fromisoformat(r["first_action_at"].replace("Z", "+00:00"))
                times.append((d2 - d1).total_seconds() / 60)
        if times:
            avg_response = round(sum(times) / len(times), 1)

    # Per-restaurant stats
    restaurants = supabase.table("restaurants").select("*").order("name").execute()
    restaurant_stats = []

    for r in restaurants.data or []:
        rid = r["id"]

        avg_rating_result = supabase.table("reviews").select("rating").eq(
            "restaurant_id", rid
        ).execute()

        ratings = [x["rating"] for x in avg_rating_result.data if x.get("rating")]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        # Rating trend (this week vs last week)
        this_week_ratings = supabase.table("reviews").select("rating").eq(
            "restaurant_id", rid
        ).gte("created_at", week_ago.isoformat()).execute()

        last_week_ratings = supabase.table("reviews").select("rating").eq(
            "restaurant_id", rid
        ).gte("created_at", (week_ago - timedelta(days=7)).isoformat()).lt(
            "created_at", week_ago.isoformat()
        ).execute()

        this_week_avg = (
            sum(x["rating"] for x in this_week_ratings.data if x.get("rating"))
            / max(len([x for x in this_week_ratings.data if x.get("rating")]), 1)
        )
        last_week_avg = (
            sum(x["rating"] for x in last_week_ratings.data if x.get("rating"))
            / max(len([x for x in last_week_ratings.data if x.get("rating")]), 1)
        )
        rating_trend = round(this_week_avg - last_week_avg, 2)

        # Open issues
        open_result = supabase.table("reviews").select("id", count="exact").eq(
            "restaurant_id", rid
        ).eq("status", "open").execute()
        open_issues = open_result.count or 0

        # SLA breached
        open_reviews = supabase.table("reviews").select("severity, detected_at").eq(
            "restaurant_id", rid
        ).eq("status", "open").execute()

        sla_breached = 0
        for rev in open_reviews.data or []:
            detected = rev.get("detected_at")
            if detected:
                dt = datetime.fromisoformat(detected.replace("Z", "+00:00"))
                threshold = SLA_THRESHOLDS.get(rev.get("severity", "medium"), 60)
                if (now - dt).total_seconds() / 60 > threshold:
                    sla_breached += 1

        # Resolved today
        resolved_r = supabase.table("reviews").select("id", count="exact").eq(
            "restaurant_id", rid
        ).eq("status", "resolved").gte("resolved_at", today_start.isoformat()).execute()
        resolved_today_r = resolved_r.count or 0

        restaurant_stats.append({
            "restaurant_id": rid,
            "restaurant_name": r["name"],
            "avg_rating": avg_rating,
            "rating_trend": rating_trend,
            "open_issues": open_issues,
            "sla_breached": sla_breached,
            "resolved_today": resolved_today_r,
        })

    return {
        "total_reviews": total_reviews,
        "critical_count": critical_count,
        "avg_response_time": avg_response,
        "resolved_today": resolved_today,
        "restaurants": restaurant_stats,
    }


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
