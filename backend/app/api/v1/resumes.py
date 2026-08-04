"""
Resume Upload & Management Endpoints (Tenant Isolated)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.resume import Resume
from app.api.deps import get_current_user
from app.services.resume_service import save_and_parse_resume

router = APIRouter(prefix="/resumes", tags=["Resumes"])


class ResumeResponse(BaseModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    raw_markdown: Optional[str] = None
    json_data: Optional[Dict[str, Any]] = None
    created_at: str


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a PDF resume, extract markdown text, and store in tenant Neon DB.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    resume = await save_and_parse_resume(file, current_user, db)

    return ResumeResponse(
        id=resume.id,
        title=resume.title,
        original_filename=resume.original_filename,
        raw_markdown=resume.raw_markdown,
        json_data=resume.json_data,
        created_at=resume.created_at.isoformat()
    )


@router.get("", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all resumes owned by the authenticated tenant.
    """
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()

    return [
        ResumeResponse(
            id=r.id,
            title=r.title,
            original_filename=r.original_filename,
            raw_markdown=r.raw_markdown,
            json_data=r.json_data,
            created_at=r.created_at.isoformat()
        )
        for r in resumes
    ]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific resume owned by the authenticated tenant.
    """
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )

    return ResumeResponse(
        id=resume.id,
        title=resume.title,
        original_filename=resume.original_filename,
        raw_markdown=resume.raw_markdown,
        json_data=resume.json_data,
        created_at=resume.created_at.isoformat()
    )
