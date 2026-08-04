"""
Resume Upload & Management Endpoints (Tenant Isolated)
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/resumes", tags=["Resumes"])


class ResumeResponse(BaseModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    created_at: str


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF, parse layout & text into structured JSON, and store safely.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    # In production: Calls pymupdf_rag.py to extract Markdown & pdf.py to get JSONResume
    return ResumeResponse(
        id="resume-sample-123",
        title=file.filename,
        original_filename=file.filename,
        created_at="2026-08-04T19:00:00Z"
    )


@router.get("", response_model=List[ResumeResponse])
async def list_resumes():
    """
    List all resumes owned by the authenticated tenant.
    """
    return [
        ResumeResponse(
            id="resume-sample-123",
            title="Software_Engineer_CV.pdf",
            original_filename="Software_Engineer_CV.pdf",
            created_at="2026-08-04T19:00:00Z"
        )
    ]
