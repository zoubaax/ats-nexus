"""
User Database Model
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    # Preferred AI Settings & Stored Keys in Neon DB
    default_ai_provider = Column(String(50), default="groq") # groq, nvidia, gemini, ollama
    custom_api_key = Column(String(512), nullable=True)       # Default key
    ai_keys = Column(JSON, default=dict)                       # Encrypted multi-provider keys

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="user", cascade="all, delete-orphan")
    master_profile = relationship("MasterProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
