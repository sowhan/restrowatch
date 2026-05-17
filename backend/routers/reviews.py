from fastapi import APIRouter, HTTPException, Query, Depends, Body
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Optional
from services.supabase_client import supabase
from routers.auth import get_user_from_token
from models.schemas import ReviewActionCreate

router = APIRouter()


def get_user_or_test(request=None):
    """Get user from token, or return test user if no auth (for local testing)."""
    try:
        return get_user_from_token(request) if request else None
    except HTTPException:
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": "Test User",
            "role": "owner",
            "restaurant_id": None,
        }


@router.get("/")
async def list_reviews(
    restaurant_id: str = Query(None),
    status: str = Query(None),
    severity: str = Query(None),
    platform: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = supabase.table("reviews").select("*, restaurants(name, city, cuisine)")

    if restaurant_id:
        query = query.eq("restaurant_id", restaurant_id)
    if status:
        query = query.eq("status", status)
    if severity:
        query = query.eq("severity", severity)
    if platform:
        query = query.eq("platform", platform)

    result = query.order("detected_at", desc=True).range(offset, offset + limit - 1).execute()
    return result.data or []


@router.get("/{review_id}")
async def get_review(review_id: str):
    result = supabase.table("reviews").select("*, restaurants(name, city, cuisine)").eq(
        "id", review_id
    ).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")

    review = result.data[0]

    if not review.get("first_viewed_at"):
        supabase.table("reviews").update({
            "first_viewed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", review_id).execute()

    actions = supabase.table("review_actions").select("*").eq(
        "review_id", review_id
    ).order("created_at", desc=True).execute()

    review["actions"] = actions.data or []
    return review


@router.get("/{review_id}/timeline")
async def get_review_timeline(review_id: str):
    review_result = supabase.table("reviews").select("*").eq("id", review_id).execute()
    if not review_result.data:
        raise HTTPException(status_code=404, detail="Review not found")

    review = review_result.data[0]
    timeline = []

    if review.get("email_received_at"):
        timeline.append({
            "timestamp": review["email_received_at"],
            "event_type": "email_received",
            "description": "Email received from platform",
        })

    if review.get("detected_at"):
        timeline.append({
            "timestamp": review["detected_at"],
            "event_type": "detected",
            "description": f"Detected and tagged as {review.get('severity', 'unknown')} severity",
        })

    timeline.append({
        "timestamp": review["created_at"] or review["detected_at"],
        "event_type": "dashboard",
        "description": "Appeared on dashboard",
    })

    if review.get("first_viewed_at"):
        timeline.append({
            "timestamp": review["first_viewed_at"],
            "event_type": "viewed",
            "description": "First viewed by team member",
        })

    actions = supabase.table("review_actions").select("*").eq(
        "review_id", review_id
    ).order("created_at", desc=True).execute()

    for action in actions.data or []:
        action_labels = {
            "called_customer": "Called customer",
            "offered_refund": "Offered refund",
            "offered_replacement": "Offered replacement",
            "spoke_to_delivery": "Spoke to delivery partner",
            "escalated_to_kitchen": "Escalated to kitchen",
            "reported_to_platform": "Reported to platform",
            "owner_escalated": "Owner escalated",
            "note": "Added note",
        }
        desc = action_labels.get(action["action_type"], action["action_type"])
        if action.get("note"):
            desc += f": {action['note']}"

        timeline.append({
            "timestamp": action["created_at"],
            "event_type": action["action_type"],
            "description": desc,
        })

    if review.get("resolved_at"):
        timeline.append({
            "timestamp": review["resolved_at"],
            "event_type": "resolved",
            "description": "Marked as RESOLVED",
        })

    timeline.sort(key=lambda x: x["timestamp"])
    return timeline


@router.patch("/{review_id}/status")
async def update_review_status(
    review_id: str,
    status: Optional[str] = Query(None),
    body: Optional[dict] = Body(None),
):
    # Accept status from query param or JSON body
    new_status = status or (body.get("status") if body else None)

    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    valid_statuses = ["open", "in_progress", "resolved"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    current = supabase.table("reviews").select("status, restaurant_id").eq(
        "id", review_id
    ).execute()

    if not current.data:
        raise HTTPException(status_code=404, detail="Review not found")

    current_status = current.data[0]["status"]
    status_order = {"open": 0, "in_progress": 1, "resolved": 2}

    if status_order.get(new_status, 0) <= status_order.get(current_status, 0) and new_status != current_status:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from '{current_status}' to '{new_status}'. Status can only move forward.",
        )

    update_data = {"status": new_status}
    if new_status == "resolved":
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("reviews").update(update_data).eq("id", review_id).execute()
    return result.data[0] if result.data else None


@router.post("/{review_id}/actions")
async def log_action(
    review_id: str,
    body: Optional[dict] = Body(None),
):
    if not body:
        raise HTTPException(status_code=400, detail="Request body is required")

    action_type = body.get("action_type")
    note = body.get("note")

    if not action_type:
        raise HTTPException(status_code=400, detail="action_type is required")

    review = supabase.table("reviews").select("status, restaurant_id").eq(
        "id", review_id
    ).execute()

    if not review.data:
        raise HTTPException(status_code=404, detail="Review not found")

    # Log the action
    action_result = supabase.table("review_actions").insert({
        "review_id": review_id,
        "user_id": "00000000-0000-0000-0000-000000000000",
        "action_type": action_type,
        "note": note,
    }).execute()

    # Auto-move to in_progress if currently open
    if review.data[0]["status"] == "open":
        supabase.table("reviews").update({
            "status": "in_progress",
            "first_action_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", review_id).execute()

    return action_result.data[0] if action_result.data else None
