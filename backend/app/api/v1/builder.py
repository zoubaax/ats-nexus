"""
ATS CV Builder & AI Bullet Point Optimizer Endpoints
"""

import json
import re
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.profile import MasterProfile
from app.api.deps import get_current_user
from app.llm.llm_utils import query_llm, extract_json_from_response

router = APIRouter(prefix="/builder", tags=["CV Builder"])


class OptimizeBulletRequest(BaseModel):
    bullet_point: str = Field(..., description="Original bullet point text")
    target_role: Optional[str] = Field("Software Engineer", description="Target job title")
    job_description: Optional[str] = Field("", description="Optional Job Description context")


class OptimizeBulletResponse(BaseModel):
    original: str
    variations: List[str]
    keywords_added: List[str]


class TailorProfileRequest(BaseModel):
    job_description: str = Field(..., description="Target Job Description")
    target_role: Optional[str] = Field("Full-Stack Developer", description="Target job role")


class TailoredCVResponse(BaseModel):
    headline: str
    summary: str
    work_history: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    skills: List[str]
    education: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    languages: List[Dict[str, Any]]
    phone: Optional[str] = ""
    location: Optional[str] = ""
    links: Dict[str, str] = {}
    matched_keywords: List[str] = []


@router.post("/optimize-bullet", response_model=OptimizeBulletResponse)
async def optimize_bullet(
    payload: OptimizeBulletRequest,
    current_user: User = Depends(get_current_user),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    AI Bullet Point Rewriter: Takes a raw bullet point and returns 3 STAR-framework ATS optimized variations.
    """
    provider = x_ai_provider or current_user.default_ai_provider or "groq"
    api_key = x_ai_key or (current_user.ai_keys or {}).get(provider, "")

    prompt = f"""
You are an expert ATS Resume Writer and Career Coach.
Transform the following raw bullet point into 3 high-impact, ATS-optimized bullet points using the STAR framework (Situation, Task, Action, Result).
Target Role: {payload.target_role}
Job Description Context: {payload.job_description or "General tech position"}

Original Bullet: "{payload.bullet_point}"

Provide JSON output strictly in this format:
{{
  "variations": [
    "Variation 1 starting with a strong action verb and metric...",
    "Variation 2 focusing on technical execution and architecture...",
    "Variation 3 focusing on impact and optimization..."
  ],
  "keywords_added": ["Action Verb", "Metric", "Tech Keyword"]
}}
"""
    try:
        raw_response = query_llm(prompt=prompt, provider=provider, api_key=api_key)
        cleaned = extract_json_from_response(raw_response)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            return OptimizeBulletResponse(
                original=payload.bullet_point,
                variations=parsed.get("variations", [payload.bullet_point]),
                keywords_added=parsed.get("keywords_added", [])
            )
    except Exception as e:
        print(f"LLM optimization error: {e}")

    # Fallback response
    return OptimizeBulletResponse(
        original=payload.bullet_point,
        variations=[
          f"Architected and deployed {payload.bullet_point} using modern best practices, resulting in 30% improved performance.",
          f"Engineered key solutions for {payload.bullet_point}, optimizing system reliability and team delivery.",
          f"Led implementation of {payload.bullet_point}, reducing processing latency and enhancing user experience."
        ],
        keywords_added=["Architected", "Engineered", "Optimized"]
    )


@router.post("/tailor", response_model=TailoredCVResponse)
async def tailor_resume_for_jd(
    payload: TailorProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    Generate an AI Tailored Resume by analyzing candidate's Master Profile in Neon DB against target Job Description.
    """
    # Fetch Candidate Master Profile from Neon DB
    result = await db.execute(select(MasterProfile).where(MasterProfile.user_id == current_user.id))
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Master Profile not found. Please fill your profile first.")

    provider = x_ai_provider or current_user.default_ai_provider or "groq"
    api_key = x_ai_key or (current_user.ai_keys or {}).get(provider, "")

    prompt = f"""
You are a Principal Talent Acquisition Lead & Technical Resume Strategist.
Tailor the candidate's Master Experience Profile specifically for the target Job Description below.

Target Role: {payload.target_role}
Target Job Description:
{payload.job_description}

Candidate Master Profile:
Headline: {profile.headline or ""}
Summary: {profile.summary or ""}
Skills Bank: {json.dumps(profile.skills or [])}
Work History: {json.dumps(profile.work_history or [])}
Projects: {json.dumps(profile.projects or [])}

INSTRUCTIONS:
1. Rewrite the professional summary into a 2 to 3 sentence technical summary tailored to the target JD.
2. Rewrite work experience and project descriptions into clean, bulleted lines (each starting with a bullet "•") focusing STRICTLY on technical architecture, key technical achievements, tech stack components, and performance metrics matching the JD.
3. Re-order technical skills putting the hard skills required by the JD at the top.
4. Extract matched keywords.

Return ONLY a JSON object formatted as follows:
{{
  "headline": "{payload.target_role}",
  "summary": "Tailored concise technical summary...",
  "work_history": [
    {{
      "title": "Job Title",
      "company": "Company",
      "dates": "Dates",
      "description": "• Architecture: Designed UML diagrams and implemented RESTful API microservices.\\n• Development: Implemented reactive state management and responsive UI components.\\n• DevOps & Cloud: Deployed containerized applications with Docker and CI/CD pipelines."
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "tech_stack": "React, Python, FastAPI, Docker, PostgreSQL",
      "description": "• Pipeline IA: Implemented RAG search pipeline with vector embeddings.\\n• Architecture: Built RESTful backend API with RBAC security.\\n• DevOps: Configured automated GitHub Actions CI/CD deployment."
    }}
  ],
  "skills": ["Matched Skill 1", "Skill 2", "Skill 3"],
  "matched_keywords": ["Keyword 1", "Keyword 2"]
}}
"""

    try:
        raw_res = query_llm(prompt=prompt, provider=provider, api_key=api_key)
        cleaned = extract_json_from_response(raw_res)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            return TailoredCVResponse(
                headline=parsed.get("headline", payload.target_role),
                summary=parsed.get("summary", profile.summary or ""),
                work_history=parsed.get("work_history", profile.work_history or []),
                projects=parsed.get("projects", profile.projects or []),
                skills=parsed.get("skills", profile.skills or []),
                education=profile.education or [],
                certifications=profile.certifications or [],
                languages=profile.languages or [],
                phone=profile.phone or "",
                location=profile.location or "",
                links=profile.links or {},
                matched_keywords=parsed.get("matched_keywords", [])
            )
    except Exception as err:
        print(f"Tailor CV LLM error: {err}")

    # Fallback if LLM fails or is rate limited
    return TailoredCVResponse(
        headline=payload.target_role,
        summary=profile.summary or "",
        work_history=profile.work_history or [],
        projects=profile.projects or [],
        skills=profile.skills or [],
        education=profile.education or [],
        certifications=profile.certifications or [],
        languages=profile.languages or [],
        phone=profile.phone or "",
        location=profile.location or "",
        links=profile.links or {},
        matched_keywords=[]
    )
