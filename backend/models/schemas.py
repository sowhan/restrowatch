from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ReviewCreate(BaseModel):
    restaurant_id: str
    platform: str
    rating: int
    review_text: Optional[str] = None
    customer_name: Optional[str] = None
    order_id: Optional[str] = None
    severity: str
    email_message_id: Optional[str] = None
    email_received_at: Optional[datetime] = None


class ReviewResponse(BaseModel):
    id: str
    restaurant_id: Optional[str] = None
    platform: Optional[str] = None
    rating: Optional[int] = None
    review_text: Optional[str] = None
    customer_name: Optional[str] = None
    order_id: Optional[str] = None
    severity: Optional[str] = None
    status: str
    email_message_id: Optional[str] = None
    email_received_at: Optional[datetime] = None
    detected_at: Optional[datetime] = None
    first_viewed_at: Optional[datetime] = None
    first_action_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewActionCreate(BaseModel):
    action_type: str
    note: Optional[str] = None


class ReviewActionResponse(BaseModel):
    id: str
    review_id: str
    user_id: str
    action_type: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RestaurantResponse(BaseModel):
    id: str
    name: str
    city: Optional[str] = None
    cuisine: Optional[str] = None
    email_alias: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: str
    name: Optional[str] = None
    role: str
    restaurant_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStat(BaseModel):
    restaurant_id: str
    restaurant_name: str
    avg_rating: float
    rating_trend: float
    open_issues: int
    sla_breached: int
    resolved_today: int


class DashboardOverview(BaseModel):
    total_reviews: int
    critical_count: int
    avg_response_time: float
    resolved_today: int
    restaurants: List[DashboardStat]


class UnmatchedEmailResponse(BaseModel):
    id: str
    email_message_id: str
    subject: Optional[str] = None
    body: Optional[str] = None
    platform: Optional[str] = None
    email_received_at: Optional[datetime] = None
    assigned_restaurant_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SLAConfig(BaseModel):
    critical: int = 15
    high: int = 30
    medium: int = 60
    low: int = 120


class TimelineEvent(BaseModel):
    timestamp: datetime
    event_type: str
    description: str
