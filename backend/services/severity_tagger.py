import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"


def tag_severity(rating: int, review_text: str) -> str:
    if not ANTHROPIC_API_KEY:
        return _rule_based_fallback(rating, review_text)

    prompt = f"""You are a restaurant review classifier. Given a customer review and star rating,
classify the severity for the restaurant owner.

Rating: {rating}/5
Review: "{review_text}"

Classify severity as exactly one of: critical, high, medium, low

Rules:
- critical: 1 star + mentions food safety, hygiene, illness, foreign objects, extreme anger
- high: 1-2 stars + wrong order, very late delivery, rude staff, inedible food
- medium: 2-3 stars + quality complaints, minor delays, packaging issues
- low: 3 stars + minor inconvenience, suggestion, mixed feedback

Respond with ONLY the severity word. Nothing else."""

    try:
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": 10,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=10.0,
        )

        if response.status_code == 200:
            result = response.json()["content"][0]["text"].strip().lower()
            if result in ("critical", "high", "medium", "low"):
                return result

        return _rule_based_fallback(rating, review_text)

    except Exception:
        return _rule_based_fallback(rating, review_text)


def _rule_based_fallback(rating: int, review_text: str) -> str:
    text = review_text.lower()

    critical_keywords = [
        "hair", "foreign", "poison", "sick", "ill", "vomit", "hospital",
        "health hazard", "food safety", "hygiene", "spoiled", "rotten",
        "disgusting", "worst", "never again", "health hazard",
    ]

    high_keywords = [
        "wrong order", "rude", "late", "cold", "inedible", "smashed",
        "stale", "raw", "tough", "waste of money", "disappointed",
    ]

    medium_keywords = [
        "oily", "packaging", "leaking", "portion", "reduced", "hard",
        "salty", "delay", "average", "okay",
    ]

    if rating == 1 and any(kw in text for kw in critical_keywords):
        return "critical"
    elif rating <= 2 and any(kw in text for kw in high_keywords):
        return "high"
    elif rating <= 2:
        return "high"
    elif rating == 3 and any(kw in text for kw in medium_keywords):
        return "medium"
    elif rating == 3:
        return "medium"
    elif rating >= 4:
        return "low"

    return "medium"
