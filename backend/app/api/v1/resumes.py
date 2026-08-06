"""
Resume Upload & Management Endpoints (Tenant Isolated)
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.resume import Resume
from app.api.deps import get_current_user
from app.services.resume_service import save_and_parse_resume, UPLOAD_DIR

router = APIRouter(prefix="/resumes", tags=["Resumes"])


class ResumeResponse(BaseModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    raw_markdown: Optional[str] = None
    json_data: Optional[Dict[str, Any]] = None
    created_at: str
    file_url: Optional[str] = None


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

    file_url = f"/uploads/{current_user.id}/{resume.original_filename}" if resume.original_filename else None

    return ResumeResponse(
        id=resume.id,
        title=resume.title,
        original_filename=resume.original_filename,
        raw_markdown=resume.raw_markdown,
        json_data=resume.json_data,
        created_at=resume.created_at.isoformat(),
        file_url=file_url
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
            created_at=r.created_at.isoformat(),
            file_url=f"/uploads/{current_user.id}/{r.original_filename}" if r.original_filename else None
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

    file_url = f"/uploads/{current_user.id}/{resume.original_filename}" if resume.original_filename else None

    return ResumeResponse(
        id=resume.id,
        title=resume.title,
        original_filename=resume.original_filename,
        raw_markdown=resume.raw_markdown,
        json_data=resume.json_data,
        created_at=resume.created_at.isoformat(),
        file_url=file_url
    )


@router.get("/{resume_id}/pdf")
async def download_resume_pdf(
    resume_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Serve the hosted PDF file directly from host storage.
    """
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id)
    )
    resume = result.scalars().first()

    if not resume or not resume.original_filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found in database."
        )

    # Check multiple path strategies for bulletproof file location
    file_path = UPLOAD_DIR / resume.user_id / resume.original_filename
    if not file_path.exists():
        file_path = UPLOAD_DIR / resume.original_filename
    if not file_path.exists():
        file_path = UPLOAD_DIR / f"{resume_id}.pdf"

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stored PDF file '{resume.original_filename}' does not exist on host server."
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"{resume.title}.pdf"
    )


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a resume from Neon DB and remove its file from host disk.
    """
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )

    if resume.original_filename:
        file_path = UPLOAD_DIR / current_user.id / resume.original_filename
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Failed to remove file {file_path}: {e}")

    await db.delete(resume)
    await db.commit()

    return {"status": "deleted", "id": resume_id}
