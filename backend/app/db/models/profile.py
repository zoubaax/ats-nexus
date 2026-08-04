"""
Master Candidate Profile Database Model (Tenant Isolated)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class MasterProfile(Base):
    __tablename__ = "master_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Tenant Isolation Key
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    headline = Column(String(255), nullable=True)
    summary = Column(String(2000), nullable=True)
    
    # Structured Experience Bank
    skills = Column(JSON, default=list)       # List of technical & soft skills
    work_history = Column(JSON, default=list) # List of work experiences & bullet points
    projects = Column(JSON, default=list)     # List of personal/open-source projects
    education = Column(JSON, default=list)    # List of degrees & certifications
    links = Column(JSON, default=dict)        # GitHub, LinkedIn, Portfolio links

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="master_profile")
