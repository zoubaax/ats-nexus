"""
Resume Database Model (Tenant Isolated)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.db.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Tenant Isolation Key
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False, default="Untitled Resume")
    original_filename = Column(String(255), nullable=True)
    raw_markdown = Column(Text, nullable=True)
    json_data = Column(JSON, nullable=True)  # Structured JSONResume format

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resumes")
    evaluations = relationship("Evaluation", back_populates="resume", cascade="all, delete-orphan")
