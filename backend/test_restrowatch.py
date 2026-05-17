#!/usr/bin/env python3
"""
RestroWatch — E2E Test Script (No Gmail Required)
Run this after your FastAPI backend is up locally.
Usage: python test_restrowatch.py
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "

results = []

def log(status, section, message):
    icon = PASS if status else FAIL
    line = f"{icon}  [{section}] {message}"
    print(line)
    results.append((status, section, message))

def section(title):
    print(f"\n{'─'*50}")
    print(f"  {title}")
    print(f"{'─'*50}")

MOCK_REVIEWS = [
    {
        "restaurant_name": "Biryani Hub",
        "platform": "zomato",
        "rating": 1,
        "review_text": "Found a cockroach in my biryani. Absolutely disgusting. Never ordering again.",
        "customer_name": "Rahul M.",
        "order_id": "ZO-7721",
        "email_message_id": "mock-email-001"
    },
    {
        "restaurant_name": "Spice Route",
        "platform": "swiggy",
        "rating": 2,
        "review_text": "Order arrived cold and 45 minutes late. The food was edible but not worth the wait.",
        "customer_name": "Divya K.",
        "order_id": "SW-8812",
        "email_message_id": "mock-email-002"
    },
    {
        "restaurant_name": "Noodle Bar",
        "platform": "zomato",
        "rating": 3,
        "review_text": "Noodles were okay but packaging was damaged. Could be better.",
        "customer_name": "Arjun S.",
        "order_id": "ZO-4432",
        "email_message_id": "mock-email-003"
    },
    {
        "restaurant_name": "The Grillhouse",
        "platform": "swiggy",
        "rating": 1,
        "review_text": "Wrong order delivered. Got paneer when I ordered chicken. Unacceptable.",
        "customer_name": "Priya R.",
        "order_id": "SW-9901",
        "email_message_id": "mock-email-004"
    },
    {
        "restaurant_name": "Coast Kitchen",
        "platform": "zomato",
        "rating": 4,
        "review_text": "Good food overall, delivery was slightly slow but acceptable.",
        "customer_name": "Mohan T.",
        "order_id": "ZO-3312",
        "email_message_id": "mock-email-005"
    },
]

def test_health():
    section("1. HEALTH CHECK")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        ok = r.status_code == 200
        log(ok, "Health", f"GET /health → {r.status_code}")
        if ok:
            log(True, "Health", f"Response: {r.json()}")
        return ok
    except Exception as e:
        log(False, "Health", f"Server not reachable: {e}")
        print(f"\n  {WARN} Make sure FastAPI is running: uvicorn main:app --reload")
        sys.exit(1)


def test_restaurants():
    section("2. RESTAURANTS")
    r = requests.get(f"{BASE_URL}/restaurants", timeout=5)
    ok = r.status_code == 200
    log(ok, "Restaurants", f"GET /restaurants → {r.status_code}")

    if ok:
        data = r.json()
        count = len(data) if isinstance(data, list) else len(data.get("data", []))
        log(count > 0, "Restaurants", f"Found {count} restaurants in DB")
        log(count >= 8, "Restaurants", f"All 8 restaurants seeded (got {count})")
        return data if isinstance(data, list) else data.get("data", [])
    return []


def test_ingest_reviews():
    section("3. REVIEW INGESTION (Mock Gmail payload)")
    review_ids = []

    for i, review in enumerate(MOCK_REVIEWS):
        r = requests.post(
            f"{BASE_URL}/ingest",
            json=review,
            timeout=10
        )
        ok = r.status_code in [200, 201]
        log(ok, "Ingest", f"Review {i+1}/5 ({review['restaurant_name']}, {review['rating']}★) → {r.status_code}")

        if ok:
            data = r.json()
            review_id = data.get("id") or data.get("review_id")
            if review_id:
                review_ids.append(review_id)
                log(True, "Ingest", f"  Review ID: {review_id}")

            severity = data.get("severity")
            log(severity is not None, "Ingest", f"  Severity tagged: {severity}")

            if severity:
                if review["rating"] == 1 and "cockroach" in review["review_text"].lower():
                    log(severity == "critical", "Severity", f"  1★ + hygiene → expected 'critical', got '{severity}'")
                elif review["rating"] == 1:
                    log(severity in ["critical", "high"], "Severity", f"  1★ → expected critical/high, got '{severity}'")
                elif review["rating"] == 2:
                    log(severity in ["high", "medium"], "Severity", f"  2★ → expected high/medium, got '{severity}'")
                elif review["rating"] >= 4:
                    log(severity in ["low", "medium"], "Severity", f"  4★ → expected low/medium, got '{severity}'")
        else:
            print(f"     Response: {r.text[:200]}")

    return review_ids


def test_deduplication(review_ids):
    section("4. DEDUPLICATION")
    if not MOCK_REVIEWS:
        log(False, "Dedup", "No reviews to test with")
        return

    duplicate = MOCK_REVIEWS[0].copy()
    r = requests.post(f"{BASE_URL}/ingest", json=duplicate, timeout=10)

    is_deduped = r.status_code in [200, 201, 409]
    log(is_deduped, "Dedup", f"Duplicate email_message_id → {r.status_code}")

    if r.status_code in [200, 201]:
        data = r.json()
        new_id = data.get("id") or data.get("review_id")
        if new_id and review_ids:
            log(new_id == review_ids[0], "Dedup", f"Same ID returned (not a new insert): {new_id}")
        else:
            log(False, "Dedup", "Could not verify — check DB manually for duplicate rows")
    elif r.status_code == 409:
        log(True, "Dedup", "409 Conflict returned — dedup working correctly")


def test_reviews_list(review_ids):
    section("5. REVIEWS LIST + FILTERS")

    r = requests.get(f"{BASE_URL}/reviews", timeout=5)
    ok = r.status_code == 200
    log(ok, "Reviews", f"GET /reviews → {r.status_code}")
    if ok:
        data = r.json()
        items = data if isinstance(data, list) else data.get("data", [])
        log(len(items) > 0, "Reviews", f"Found {len(items)} reviews total")

    for platform in ["swiggy", "zomato"]:
        r = requests.get(f"{BASE_URL}/reviews?platform={platform}", timeout=5)
        ok = r.status_code == 200
        log(ok, "Reviews", f"Filter platform={platform} → {r.status_code}")

    for severity in ["critical", "high"]:
        r = requests.get(f"{BASE_URL}/reviews?severity={severity}", timeout=5)
        ok = r.status_code == 200
        log(ok, "Reviews", f"Filter severity={severity} → {r.status_code}")

    r = requests.get(f"{BASE_URL}/reviews?status=open", timeout=5)
    ok = r.status_code == 200
    log(ok, "Reviews", f"Filter status=open → {r.status_code}")


def test_review_detail(review_ids):
    section("6. SINGLE REVIEW DETAIL")
    if not review_ids:
        log(False, "Detail", "No review IDs available — skipping")
        return None

    rid = review_ids[0]
    r = requests.get(f"{BASE_URL}/reviews/{rid}", timeout=5)
    ok = r.status_code == 200
    log(ok, "Detail", f"GET /reviews/{rid} → {r.status_code}")

    if ok:
        data = r.json()
        has_review   = "review_text" in data or "text" in data
        has_severity = "severity" in data
        has_status   = "status" in data
        has_actions  = "actions" in data or "review_actions" in data

        log(has_review,   "Detail", "Has review_text field")
        log(has_severity, "Detail", "Has severity field")
        log(has_status,   "Detail", "Has status field")
        log(has_actions,  "Detail", "Has actions/timeline array")

    return rid


def test_action_logging(review_ids):
    section("7. ACTION LOGGING")
    if not review_ids:
        log(False, "Actions", "No review IDs — skipping")
        return

    rid = review_ids[0]

    payload = {
        "action_type": "called_customer",
        "note": "Called customer, apologized and offered replacement. Customer accepted."
    }
    r = requests.post(f"{BASE_URL}/reviews/{rid}/actions", json=payload, timeout=5)
    ok = r.status_code in [200, 201]
    log(ok, "Actions", f"POST /reviews/{rid}/actions → {r.status_code}")

    if ok:
        data = r.json()
        log("id" in data or "action_id" in data, "Actions", "Action ID returned")

    r2 = requests.get(f"{BASE_URL}/reviews/{rid}", timeout=5)
    if r2.status_code == 200:
        status = r2.json().get("status")
        log(status == "in_progress", "Actions", f"Status auto-updated to in_progress (got '{status}')")

    payload2 = {
        "action_type": "offered_refund",
        "note": "Issued full refund via Zomato partner panel."
    }
    r3 = requests.post(f"{BASE_URL}/reviews/{rid}/actions", json=payload2, timeout=5)
    log(r3.status_code in [200, 201], "Actions", f"Second action logged → {r3.status_code}")


def test_status_update(review_ids):
    section("8. STATUS TRANSITIONS")
    if not review_ids:
        log(False, "Status", "No review IDs — skipping")
        return

    rid = review_ids[0]

    r = requests.patch(
        f"{BASE_URL}/reviews/{rid}/status",
        json={"status": "in_progress"},
        timeout=5
    )
    log(r.status_code in [200, 201], "Status", f"open → in_progress → {r.status_code}")

    r2 = requests.patch(
        f"{BASE_URL}/reviews/{rid}/status",
        json={"status": "resolved"},
        timeout=5
    )
    log(r2.status_code in [200, 201], "Status", f"in_progress → resolved → {r2.status_code}")

    r3 = requests.get(f"{BASE_URL}/reviews/{rid}", timeout=5)
    if r3.status_code == 200:
        resolved_at = r3.json().get("resolved_at")
        log(resolved_at is not None, "Status", f"resolved_at timestamp set: {resolved_at}")

    r4 = requests.patch(
        f"{BASE_URL}/reviews/{rid}/status",
        json={"status": "open"},
        timeout=5
    )
    log(r4.status_code in [400, 422, 409], "Status", f"Reverse transition blocked → {r4.status_code} (expected 4xx)")


def test_owner_dashboard():
    section("9. OWNER DASHBOARD OVERVIEW")
    r = requests.get(f"{BASE_URL}/dashboard/overview", timeout=5)
    ok = r.status_code == 200
    log(ok, "Dashboard", f"GET /dashboard/overview → {r.status_code}")

    if ok:
        data = r.json()
        items = data if isinstance(data, list) else data.get("restaurants") or data.get("data", [])
        log(len(items) > 0, "Dashboard", f"Overview has {len(items)} restaurant entries")

        if items:
            first = items[0]
            has_name       = "name" in first or "restaurant_name" in first
            has_open       = "open_count" in first or "open" in first or "open_issues" in first
            has_rating     = "avg_rating" in first or "rating" in first
            has_resolved   = "resolved_today" in first or "resolved" in first

            log(has_name,     "Dashboard", "Has restaurant name")
            log(has_open,     "Dashboard", "Has open_count field")
            log(has_rating,   "Dashboard", "Has avg_rating field")
            log(has_resolved, "Dashboard", "Has resolved_today field")


def test_realtime_supabase():
    section("10. SUPABASE REALTIME (connectivity check)")
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    data = r.json() if r.status_code == 200 else {}

    supabase_ok = data.get("supabase") == "connected" or data.get("db") == "ok"
    log(supabase_ok, "Realtime", "Supabase connection confirmed via /health")

    if not supabase_ok:
        print(f"     {WARN} Add supabase connectivity status to your /health endpoint")


def test_unmatched_restaurant():
    section("11. UNMATCHED RESTAURANT HANDLING")
    fake_review = {
        "restaurant_name": "Ghost Kitchen XYZ",
        "platform": "zomato",
        "rating": 1,
        "review_text": "Terrible experience.",
        "customer_name": "Test User",
        "order_id": "ZO-0000",
        "email_message_id": "mock-email-unmatched-001"
    }

    r = requests.post(f"{BASE_URL}/ingest", json=fake_review, timeout=10)
    ok = r.status_code != 500
    log(ok, "Unmatched", f"Unknown restaurant → {r.status_code} (should not be 500)")

    if r.status_code in [200, 201]:
        data = r.json()
        flagged = data.get("matched") is False or data.get("unmatched") is True or "unmatched" in str(data).lower()
        log(flagged, "Unmatched", "Response flags it as unmatched")


def test_cors():
    section("12. CORS (Frontend can call Backend)")
    try:
        r = requests.options(
            f"{BASE_URL}/reviews",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            },
            timeout=5
        )
        cors_header = r.headers.get("access-control-allow-origin", "")
        ok = cors_header in ["*", "http://localhost:5173"]
        log(ok, "CORS", f"Access-Control-Allow-Origin: {cors_header or 'NOT SET'}")
    except Exception as e:
        log(False, "CORS", f"CORS check failed: {e}")


def print_summary():
    section("SUMMARY")
    passed = sum(1 for ok, _, _ in results if ok)
    failed = sum(1 for ok, _, _ in results if not ok)
    total  = len(results)

    print(f"\n  Total checks : {total}")
    print(f"  {PASS} Passed      : {passed}")
    print(f"  {FAIL} Failed      : {failed}")

    if failed > 0:
        print(f"\n  Failed checks:")
        for ok, section_name, message in results:
            if not ok:
                print(f"    {FAIL} [{section_name}] {message}")

    print(f"\n  {'All checks passed! App is working end-to-end.' if failed == 0 else 'Fix the failed checks above.'}")
    print()


if __name__ == "__main__":
    print(f"\n{'═'*50}")
    print(f"  RestroWatch — E2E Test Suite")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Target: {BASE_URL}")
    print(f"{'═'*50}")

    test_health()
    restaurants      = test_restaurants()
    review_ids       = test_ingest_reviews()

    time.sleep(1)

    test_deduplication(review_ids)
    test_reviews_list(review_ids)
    test_review_detail(review_ids)
    test_action_logging(review_ids)
    test_status_update(review_ids)
    test_owner_dashboard()
    test_realtime_supabase()
    test_unmatched_restaurant()
    test_cors()
    print_summary()
