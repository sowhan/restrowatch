import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from routers import gmail, reviews, auth, settings
from services.gmail_parser import poll_gmail_for_reviews
from services.supabase_client import supabase
from services.dashboard_stats import get_dashboard_overview_data

app = FastAPI(title="RestroWatch API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    return get_dashboard_overview_data(include_rating_trend=False)


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
        # Store as unmatched (with dedup check)
        if email_message_id:
            existing_unmatched = supabase.table("unmatched_emails").select("id").eq(
                "email_message_id", email_message_id
            ).execute()
            if existing_unmatched.data:
                return {
                    "status": "unmatched_duplicate",
                    "matched": False,
                    "unmatched": True,
                    "restaurant_name": restaurant_name,
                    "message": f"Unmatched email already stored for '{restaurant_name}'",
                }

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
