from datetime import datetime, timezone, timedelta
from services.supabase_client import supabase
from services.sla_calculator import SLA_THRESHOLDS


def _parse_timestamp(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def get_dashboard_overview_data(include_rating_trend: bool = True):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    restaurants = supabase.table("restaurants").select("id, name, city").order("name").execute()
    reviews = supabase.table("reviews").select(
        "restaurant_id, rating, severity, status, created_at, detected_at, first_action_at, resolved_at"
    ).execute()

    restaurants_data = restaurants.data or []
    reviews_data = reviews.data or []

    total_reviews = 0
    critical_count = 0
    resolved_today = 0
    response_times = []

    grouped_reviews = {}
    for review in reviews_data:
        review_created_at = _parse_timestamp(review.get("created_at"))
        review_detected_at = _parse_timestamp(review.get("detected_at"))
        review_first_action_at = _parse_timestamp(review.get("first_action_at"))
        review_resolved_at = _parse_timestamp(review.get("resolved_at"))

        review["_created_at_dt"] = review_created_at
        review["_detected_at_dt"] = review_detected_at
        review["_first_action_at_dt"] = review_first_action_at
        review["_resolved_at_dt"] = review_resolved_at

        rid = review.get("restaurant_id")
        grouped_reviews.setdefault(rid, []).append(review)

        if review_created_at and review_created_at >= today_start:
            total_reviews += 1

        if review.get("severity") == "critical" and review.get("status") in ["open", "in_progress"]:
            critical_count += 1

        if review.get("status") == "resolved" and review_resolved_at and review_resolved_at >= today_start:
            resolved_today += 1

        if review_detected_at and review_first_action_at:
            response_times.append((review_first_action_at - review_detected_at).total_seconds() / 60)

    avg_response = round(sum(response_times) / len(response_times), 1) if response_times else 0

    restaurant_stats = []
    for restaurant in restaurants_data:
        rid = restaurant["id"]
        restaurant_reviews = grouped_reviews.get(rid, [])

        ratings = [r["rating"] for r in restaurant_reviews if r.get("rating")]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        open_reviews = [r for r in restaurant_reviews if r.get("status") == "open"]
        open_issues = len(open_reviews)

        sla_breached = 0
        for review in open_reviews:
            detected = review.get("_detected_at_dt")
            if not detected:
                continue
            threshold = SLA_THRESHOLDS.get(review.get("severity", "medium"), 60)
            if (now - detected).total_seconds() / 60 > threshold:
                sla_breached += 1

        resolved_today_r = sum(
            1
            for r in restaurant_reviews
            if r.get("status") == "resolved"
            and (r.get("_resolved_at_dt") and r.get("_resolved_at_dt") >= today_start)
        )

        stat = {
            "restaurant_id": rid,
            "restaurant_name": restaurant["name"],
            "name": restaurant["name"],
            "avg_rating": avg_rating,
            "open_issues": open_issues,
            "open_count": open_issues,
            "sla_breached": sla_breached,
            "resolved_today": resolved_today_r,
            "city": restaurant.get("city"),
        }

        if include_rating_trend:
            this_week_ratings = [
                r["rating"]
                for r in restaurant_reviews
                if r.get("rating")
                and (r.get("_created_at_dt") and r.get("_created_at_dt") >= week_ago)
            ]
            last_week_ratings = [
                r["rating"]
                for r in restaurant_reviews
                if r.get("rating")
                and (r.get("_created_at_dt") and two_weeks_ago <= r.get("_created_at_dt") < week_ago)
            ]

            this_week_avg = sum(this_week_ratings) / len(this_week_ratings) if this_week_ratings else 0
            last_week_avg = sum(last_week_ratings) / len(last_week_ratings) if last_week_ratings else 0
            stat["rating_trend"] = round(this_week_avg - last_week_avg, 2)

        restaurant_stats.append(stat)

    return {
        "total_reviews": total_reviews,
        "critical_count": critical_count,
        "avg_response_time": avg_response,
        "resolved_today": resolved_today,
        "restaurants": restaurant_stats,
    }
