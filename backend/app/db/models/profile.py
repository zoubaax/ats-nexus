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
    phone = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    
    # Structured Experience Bank
    skills = Column(JSON, default=list)        # List of technical & soft skills
    work_history = Column(JSON, default=list)  # List of work experiences (Full-Time, Stage/Internship, etc.)
    projects = Column(JSON, default=list)      # List of personal/open-source projects & products
    education = Column(JSON, default=list)     # List of degrees & schools
    certifications = Column(JSON, default=list)# List of certifications & credentials
    languages = Column(JSON, default=list)     # List of languages & proficiency levels
    links = Column(JSON, default=dict)         # GitHub, LinkedIn, Portfolio links

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="master_profile")
