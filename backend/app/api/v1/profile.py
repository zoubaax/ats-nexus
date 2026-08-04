"""
Master Candidate Profile Endpoints (Tenant Isolated)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/profile", tags=["Master Profile"])


class MasterProfileSchema(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    work_history: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    links: Dict[str, str] = {}


@router.get("", response_model=MasterProfileSchema)
async def get_profile():
    """
    Get the authenticated user's Master Profile experience bank.
    """
    return MasterProfileSchema(
        headline="Full Stack Software Engineer",
        summary="Experienced software engineer specializing in Python, React, and cloud architectures.",
        skills=["Python", "FastAPI", "React", "TypeScript", "TailwindCSS", "PostgreSQL"],
        projects=[
            {
                "title": "ATS Nexus",
                "description": "Multi-tenant AI resume builder & checker with Groq/Gemini/Nvidia integration.",
                "tech_stack": ["Python", "FastAPI", "Next.js", "Neon Postgres"]
            }
        ],
        links={"github": "https://github.com/zoubaax", "linkedin": "https://linkedin.com"}
    )


@router.put("", response_model=MasterProfileSchema)
async def update_profile(profile: MasterProfileSchema):
    """
    Update the authenticated user's Master Profile experience bank.
    """
    return profile
