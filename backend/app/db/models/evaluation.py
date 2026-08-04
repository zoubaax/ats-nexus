"""
Evaluation & Score Database Model (Tenant Isolated)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer, Text
from sqlalchemy.orm import relationship
from backend.app.db.base import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Tenant Isolation Keys
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    job_title = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=True)

    overall_score = Column(Integer, nullable=False)
    score_breakdown = Column(JSON, nullable=True)     # Detailed category scores & evidence
    missing_keywords = Column(JSON, nullable=True)    # Hard skills / keywords missing
    actionable_feedback = Column(JSON, nullable=True)# Category tips and fixes

    ai_provider_used = Column(String(50), nullable=True)
    ai_model_used = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="evaluations")
    resume = relationship("Resume", back_populates="evaluations")
