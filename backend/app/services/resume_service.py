"""
Resume Service for Processing PDF Uploads and Extraction
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.resume import Resume
from app.db.models.user import User

logger = logging.getLogger(__name__)

# Uploads directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_and_parse_resume(
    file: UploadFile,
    current_user: User,
    db: AsyncSession
) -> Resume:
    """
    Saves an uploaded PDF file, extracts Markdown text using PyMuPDF RAG,
    and stores the tenant-isolated record in Neon DB.
    """
    tenant_upload_dir = UPLOAD_DIR / current_user.id
    tenant_upload_dir.mkdir(parents=True, exist_ok=True)

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = tenant_upload_dir / unique_filename

    # Read and save PDF file bytes
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Extract Markdown text from PDF using core engine
    raw_markdown = ""
    try:
        from app.core.pdf import PDFHandler
        pdf_handler = PDFHandler()
        extracted_text = pdf_handler.extract_text_from_pdf(str(file_path))
        if extracted_text:
            raw_markdown = extracted_text
    except Exception as e:
        logger.warning(f"Core PDF parsing fell back to basic text read: {e}")
        # Fallback reading via PyMuPDF if core handler needs LLM setup
        try:
            import fitz  # pymupdf
            with fitz.open(str(file_path)) as doc:
                text_pages = [page.get_text() for page in doc]
                raw_markdown = "\n\n".join(text_pages)
        except Exception as fallback_err:
            logger.error(f"Fallback PyMuPDF extraction error: {fallback_err}")
            raw_markdown = "Failed to parse PDF text content."

    # Create Resume DB Record
    resume = Resume(
        user_id=current_user.id,
        title=file.filename or "Uploaded Resume.pdf",
        original_filename=file.filename,
        raw_markdown=raw_markdown,
        json_data={"raw_text": raw_markdown}
    )

    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return resume
