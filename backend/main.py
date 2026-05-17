from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from routers import gmail, reviews, auth, settings
from services.gmail_parser import poll_gmail_for_reviews
from services.supabase_client import supabase

app = FastAPI(title="RestroWatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(gmail.router, prefix="/gmail", tags=["gmail"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])


@app.on_event("startup")
async def startup():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        poll_gmail_for_reviews,
        "interval",
        seconds=60,
        id="gmail_poll",
        replace_existing=True,
    )
    scheduler.start()


@app.get("/health")
async def health():
    try:
        supabase.table("restaurants").select("id").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {"status": "ok", "service": "restrowatch-api", "db": db_status}


@app.get("/restaurants")
async def list_restaurants():
    """Alias for /settings/restaurants — used by tests and frontend."""
    from services.supabase_client import supabase
    result = supabase.table("restaurants").select("*").order("name").execute()
    return result.data or []


@app.get("/dashboard/overview")
async def dashboard_overview():
    """Alias for /settings/dashboard/overview — used by tests."""
    from services.supabase_client import supabase
    from services.sla_calculator import SLA_THRESHOLDS
    from datetime import datetime, timezone, timedelta

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    total_result = supabase.table("reviews").select("id", count="exact").gte(
        "created_at", today_start.isoformat()
    ).execute()
    total_reviews = total_result.count or 0

    critical_result = supabase.table("reviews").select("id", count="exact").eq(
        "severity", "critical"
    ).in_("status", ["open", "in_progress"]).execute()
    critical_count = critical_result.count or 0

    resolved_result = supabase.table("reviews").select("id", count="exact").eq(
        "status", "resolved"
    ).gte("resolved_at", today_start.isoformat()).execute()
    resolved_today = resolved_result.count or 0

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

    restaurants = supabase.table("restaurants").select("*").order("name").execute()
    restaurant_stats = []

    for r in restaurants.data or []:
        rid = r["id"]

        avg_rating_result = supabase.table("reviews").select("rating").eq(
            "restaurant_id", rid
        ).execute()

        ratings = [x["rating"] for x in avg_rating_result.data if x.get("rating")]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        open_result = supabase.table("reviews").select("id", count="exact").eq(
            "restaurant_id", rid
        ).eq("status", "open").execute()
        open_issues = open_result.count or 0

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

        resolved_r = supabase.table("reviews").select("id", count="exact").eq(
            "restaurant_id", rid
        ).eq("status", "resolved").gte("resolved_at", today_start.isoformat()).execute()
        resolved_today_r = resolved_r.count or 0

        restaurant_stats.append({
            "restaurant_id": rid,
            "name": r["name"],
            "restaurant_name": r["name"],
            "avg_rating": avg_rating,
            "open_count": open_issues,
            "open_issues": open_issues,
            "sla_breached": sla_breached,
            "resolved_today": resolved_today_r,
            "city": r.get("city"),
        })

    return {
        "total_reviews": total_reviews,
        "critical_count": critical_count,
        "avg_response_time": avg_response,
        "resolved_today": resolved_today,
        "restaurants": restaurant_stats,
    }


@app.post("/ingest")
async def ingest_review(payload: dict):
    """Ingest a review from mock/Gmail payload. Used by tests and Gmail parser."""
    from services.supabase_client import supabase
    from services.severity_tagger import tag_severity

    restaurant_name = payload.get("restaurant_name", "")
    platform = payload.get("platform", "unknown")
    rating = payload.get("rating", 3)
    review_text = payload.get("review_text", "")
    customer_name = payload.get("customer_name")
    order_id = payload.get("order_id")
    email_message_id = payload.get("email_message_id")

    # Deduplication
    if email_message_id:
        existing = supabase.table("reviews").select("id").eq(
            "email_message_id", email_message_id
        ).execute()
        if existing.data:
            return {
                "status": "duplicate",
                "id": existing.data[0]["id"],
                "message": "Review already exists",
            }

    # Match restaurant
    restaurant = supabase.table("restaurants").select("*").ilike(
        "email_alias", restaurant_name
    ).execute()

    if not restaurant.data:
        # Store as unmatched
        supabase.table("unmatched_emails").insert({
            "email_message_id": email_message_id,
            "subject": f"Review for {restaurant_name}",
            "body": review_text[:5000],
            "platform": platform,
        }).execute()
        return {
            "status": "unmatched",
            "matched": False,
            "unmatched": True,
            "restaurant_name": restaurant_name,
            "message": f"No restaurant found matching '{restaurant_name}'",
        }

    restaurant_id = restaurant.data[0]["id"]
    severity = tag_severity(rating, review_text)

    review_data = {
        "restaurant_id": restaurant_id,
        "platform": platform,
        "rating": rating,
        "review_text": review_text,
        "customer_name": customer_name,
        "order_id": order_id,
        "severity": severity,
        "email_message_id": email_message_id,
    }

    result = supabase.table("reviews").insert(review_data).execute()

    if result.data:
        return {**result.data[0], "matched": True}
    else:
        return {"status": "error", "message": "Failed to insert review"}
