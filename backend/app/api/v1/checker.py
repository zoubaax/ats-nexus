"""
ATS CV Checker & JD Matcher Endpoints
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.resume import Resume
from app.api.deps import get_current_user
from app.services.checker_service import compute_ats_score, save_evaluation_record

router = APIRouter(prefix="/checker", tags=["ATS Checker"])


class EvaluateRequest(BaseModel):
    resume_id: Optional[str] = Field(None, description="ID of a saved resume")
    resume_text: Optional[str] = Field(None, description="Raw resume text or markdown if not using saved resume_id")
    job_description: str = Field(..., description="Target Job Description text")
    target_role: Optional[str] = Field("Software Engineer", description="Target job title/role")


class EvaluateResponse(BaseModel):
    overall_score: int
    target_role: str
    breakdown: Dict[str, Any]
    missing_keywords: List[str]
    actionable_feedback: List[str]
    provider_used: str


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_resume(
    payload: EvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    Evaluates a resume against a target Job Description.
    Supports multi-provider execution (Groq, Nvidia, Gemini, BYOK).
    """
    resume_text = payload.resume_text or ""
    resume_obj = None

    # Fetch saved resume if resume_id is provided
    if payload.resume_id:
        result = await db.execute(
            select(Resume).where(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
        )
        resume_obj = result.scalars().first()
        if not resume_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found."
            )
        resume_text = resume_obj.raw_markdown or ""

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid resume or select an uploaded CV."
        )

    provider = x_ai_provider or current_user.default_ai_provider or "groq"

    # Evaluate ATS score and keyword match
    evaluation_data = compute_ats_score(
        resume_text=resume_text,
        job_description=payload.job_description,
        target_role=payload.target_role or "Software Engineer",
        provider=provider
    )

    # Save record if linked to a saved resume
    if resume_obj:
        await save_evaluation_record(
            user_id=current_user.id,
            resume_id=resume_obj.id,
            evaluation_result=evaluation_data,
            job_description=payload.job_description,
            db=db
        )

    return EvaluateResponse(**evaluation_data)
