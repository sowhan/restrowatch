import re
import base64
from typing import Optional, Dict, Any
from datetime import timedelta
from services.supabase_client import supabase
from services.severity_tagger import tag_severity


ZOMATO_SUBJECT_PATTERNS = [
    r"New review for (.+?)\s*[—-]\s*(\d+)\s*stars?",
    r"Customer feedback:\s*(.+?)\s*\((\d+)/5\)",
    r"New feedback for (.+?)\s*[—-]\s*(\d+)\s*★",
]

SWIGGY_SUBJECT_PATTERNS = [
    r"Customer review:\s*(.+?)\s*\((\d+)/5\)",
    r"New feedback for (.+?)\s*[—-]\s*(\d+)\s*★",
    r"Review from (.+?)\s*[—-]\s*(\d+)\s*stars?",
]


def poll_gmail_for_reviews():
    """Main polling function called by APScheduler every 60 seconds."""
    try:
        from services.gmail_client import get_gmail_service, get_last_sync_time, update_sync_time
        gmail_service = get_gmail_service()
        if not gmail_service:
            print("[GMAIL] No Gmail service available. Skipping poll.")
            return

        last_sync = get_last_sync_time()
        query = f"from:(noreply@zomato.com OR noreply@swiggy.in)"
        if last_sync:
            from datetime import datetime
            if isinstance(last_sync, str):
                last_sync_dt = datetime.fromisoformat(last_sync.replace("Z", "+00:00"))
            else:
                last_sync_dt = last_sync
            after_date = (last_sync_dt - timedelta(minutes=5)).strftime("%Y/%m/%d")
            query += f" after:{after_date}"

        results = gmail_service.users().messages().list(
            userId="me", q=query, maxResults=20
        ).execute()

        messages = results.get("messages", [])
        if not messages:
            print("[GMAIL] No new review emails found.")
            return

        for msg in messages:
            process_email_message(gmail_service, msg["id"])

        update_sync_time()
        print(f"[GMAIL] Processed {len(messages)} messages.")

    except Exception as e:
        print(f"[GMAIL] Poll error: {e}")


def process_email_message(gmail_service, message_id: str):
    """Process a single Gmail message."""
    try:
        msg = gmail_service.users().messages().get(
            userId="me", id=message_id, format="full"
        ).execute()

        email_message_id = msg.get("id")

        # Deduplication check
        existing = supabase.table("reviews").select("id").eq(
            "email_message_id", email_message_id
        ).execute()

        if existing.data:
            print(f"[GMAIL] Duplicate email skipped: {email_message_id}")
            return

        headers = msg.get("payload", {}).get("headers", [])
        subject = ""
        from_email = ""
        date_str = ""

        for h in headers:
            if h["name"] == "Subject":
                subject = h["value"]
            elif h["name"] == "From":
                from_email = h["value"]
            elif h["name"] == "Date":
                date_str = h["value"]

        platform = _detect_platform(from_email)
        parsed = parse_email_subject(subject)

        if not parsed:
            # Try to parse from body
            body = _extract_body(msg)
            parsed = _parse_from_body(body, platform)

        if not parsed:
            # Store as unmatched
            body = _extract_body(msg)
            supabase.table("unmatched_emails").insert({
                "email_message_id": email_message_id,
                "subject": subject,
                "body": body[:5000],
                "platform": platform,
                "email_received_at": date_str or None,
            }).execute()
            print(f"[GMAIL] Unmatched email stored: {subject}")
            return

        # Match restaurant
        restaurant = supabase.table("restaurants").select("*").ilike(
            "email_alias", parsed["restaurant_name"]
        ).execute()

        if not restaurant.data:
            body = _extract_body(msg)
            supabase.table("unmatched_emails").insert({
                "email_message_id": email_message_id,
                "subject": subject,
                "body": body[:5000],
                "platform": platform,
                "email_received_at": date_str or None,
            }).execute()
            print(f"[GMAIL] No restaurant match for: {parsed['restaurant_name']}")
            return

        restaurant_id = restaurant.data[0]["id"]
        review_text = parsed.get("review_text", "") or _extract_body(msg)[:1000]
        severity = tag_severity(parsed.get("rating", 3), review_text)

        review_data = {
            "restaurant_id": restaurant_id,
            "platform": platform,
            "rating": parsed.get("rating", 3),
            "review_text": review_text,
            "customer_name": parsed.get("customer_name"),
            "order_id": parsed.get("order_id"),
            "severity": severity,
            "email_message_id": email_message_id,
            "email_received_at": date_str or None,
        }

        supabase.table("reviews").insert(review_data).execute()
        print(f"[GMAIL] New review inserted: {parsed['restaurant_name']} - {severity}")

    except Exception as e:
        print(f"[GMAIL] Error processing message {message_id}: {e}")


def parse_email_subject(subject: str) -> Optional[Dict[str, Any]]:
    """Parse email subject to extract review data."""
    for pattern in ZOMATO_SUBJECT_PATTERNS + SWIGGY_SUBJECT_PATTERNS:
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            groups = match.groups()
            return {
                "restaurant_name": groups[0].strip(),
                "rating": int(groups[1]),
                "review_text": None,
                "customer_name": None,
                "order_id": None,
            }
    return None


def _detect_platform(from_email: str) -> str:
    email = from_email.lower()
    if "zomato" in email:
        return "zomato"
    elif "swiggy" in email:
        return "swiggy"
    return "unknown"


def _extract_body(msg: dict) -> str:
    """Extract plain text body from Gmail message."""
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])

    if "body" in payload and payload["body"].get("data"):
        return base64.urlsafe_b64decode(
            payload["body"]["data"]
        ).decode("utf-8", errors="ignore")

    for part in parts:
        mime_type = part.get("mimeType", "")
        if "text/plain" in mime_type and part.get("body", {}).get("data"):
            return base64.urlsafe_b64decode(
                part["body"]["data"]
            ).decode("utf-8", errors="ignore")
        if "multipart" in mime_type and "parts" in part:
            for sub_part in part["parts"]:
                if "text/plain" in sub_part.get("mimeType", ""):
                    if sub_part.get("body", {}).get("data"):
                        return base64.urlsafe_b64decode(
                            sub_part["body"]["data"]
                        ).decode("utf-8", errors="ignore")

    return ""


def _parse_from_body(body: str, platform: str) -> Optional[Dict[str, Any]]:
    """Fallback: try to extract review data from email body."""
    if not body:
        return None

    rating_match = re.search(r"(\d)\s*[/★]\s*5", body)
    rating = int(rating_match.group(1)) if rating_match else 3

    name_match = re.search(r"(?:Customer|From|By):\s*([A-Za-z\s.]+)", body)
    customer_name = name_match.group(1).strip() if name_match else None

    order_match = re.search(r"(?:Order|Ref)[\s#:]*([A-Z0-9-]+)", body, re.IGNORECASE)
    order_id = order_match.group(1) if order_match else None

    return {
        "restaurant_name": None,
        "rating": rating,
        "review_text": body[:1000],
        "customer_name": customer_name,
        "order_id": order_id,
    }

