"""
ATS CV Checker & JD Matcher Endpoints
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

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
    missing_keywords: list[str]
    actionable_feedback: list[str]
    provider_used: str


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_resume(
    payload: EvaluateRequest,
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key")
):
    """
    Evaluates a resume against a target Job Description.
    Supports multi-provider execution (Groq, Nvidia, Gemini, BYOK).
    """
    if not payload.resume_id and not payload.resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either resume_id or resume_text must be provided."
        )

    provider = x_ai_provider or "groq"

    # Placeholder logic for initial engine connection
    # Real evaluation calls evaluator.py and score.py
    mock_score = 85
    mock_breakdown = {
        "technical_skills": {"score": 90, "evidence": ["Proficient in Python, React, PostgreSQL"]},
        "project_quality": {"score": 80, "evidence": ["Built full-stack web applications"]},
        "experience_relevance": {"score": 85, "evidence": ["2+ years relevant internship experience"]}
    }

    return EvaluateResponse(
        overall_score=mock_score,
        target_role=payload.target_role,
        breakdown=mock_breakdown,
        missing_keywords=["Kubernetes", "Redis", "Docker"],
        actionable_feedback=[
            "Add quantifiable metrics to your second project",
            "Mention experience with Redis or Docker in your Technical Skills section"
        ],
        provider_used=provider
    )
