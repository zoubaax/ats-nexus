"""
Master Candidate Profile Endpoints (Tenant Isolated in Neon DB)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.profile import MasterProfile
from app.api.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Master Profile"])


class MasterProfileSchema(BaseModel):
    headline: Optional[str] = ""
    summary: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    skills: List[str] = []
    work_history: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    links: Dict[str, str] = {}


@router.get("", response_model=MasterProfileSchema)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the authenticated user's Master Profile experience bank from Neon DB.
    """
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    profile = result.scalars().first()

    if not profile:
        profile = MasterProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return MasterProfileSchema(
        headline=profile.headline or "",
        summary=profile.summary or "",
        phone=profile.phone or "",
        location=profile.location or "",
        skills=profile.skills or [],
        work_history=profile.work_history or [],
        projects=profile.projects or [],
        education=profile.education or [],
        certifications=profile.certifications or [],
        languages=profile.languages or [],
        links=profile.links or {}
    )


@router.put("", response_model=MasterProfileSchema)
async def update_profile(
    payload: MasterProfileSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the authenticated user's Master Profile experience bank in Neon DB.
    """
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    profile = result.scalars().first()

    if not profile:
        profile = MasterProfile(user_id=current_user.id)
        db.add(profile)

    profile.headline = payload.headline
    profile.summary = payload.summary
    profile.phone = payload.phone
    profile.location = payload.location
    profile.skills = payload.skills
    profile.work_history = payload.work_history
    profile.projects = payload.projects
    profile.education = payload.education
    profile.certifications = payload.certifications
    profile.languages = payload.languages
    profile.links = payload.links

    await db.commit()
    await db.refresh(profile)

    return MasterProfileSchema(
        headline=profile.headline or "",
        summary=profile.summary or "",
        phone=profile.phone or "",
        location=profile.location or "",
        skills=profile.skills or [],
        work_history=profile.work_history or [],
        projects=profile.projects or [],
        education=profile.education or [],
        certifications=profile.certifications or [],
        languages=profile.languages or [],
        links=profile.links or {}
    )
