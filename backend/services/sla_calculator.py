SLA_THRESHOLDS = {
    "critical": 15,
    "high": 30,
    "medium": 60,
    "low": 120,
}


def calculate_sla_status(severity: str, detected_at, now=None):
    from datetime import datetime, timezone

    if now is None:
        now = datetime.now(timezone.utc)

    if isinstance(detected_at, str):
        from datetime import datetime
        detected_at = datetime.fromisoformat(detected_at.replace("Z", "+00:00"))

    threshold_minutes = SLA_THRESHOLDS.get(severity, 60)
    elapsed = (now - detected_at).total_seconds() / 60
    remaining = threshold_minutes - elapsed

    if remaining <= 0:
        return {
            "status": "breached",
            "remaining_minutes": 0,
            "overdue_minutes": abs(int(remaining)),
            "threshold_minutes": threshold_minutes,
        }
    else:
        return {
            "status": "ok",
            "remaining_minutes": int(remaining),
            "overdue_minutes": 0,
            "threshold_minutes": threshold_minutes,
        }


def get_threshold(severity: str) -> int:
    return SLA_THRESHOLDS.get(severity, 60)
