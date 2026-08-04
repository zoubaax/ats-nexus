"""
User AI Settings & BYOK API Endpoints (Saved in Neon DB)
"""

from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsSchema(BaseModel):
    default_ai_provider: str = "groq"
    ai_keys: Dict[str, str] = {}


@router.get("", response_model=SettingsSchema)
async def get_settings(current_user: User = Depends(get_current_user)):
    """
    Fetch the authenticated user's AI provider preference and stored keys from Neon DB.
    """
    return SettingsSchema(
        default_ai_provider=current_user.default_ai_provider or "groq",
        ai_keys=current_user.ai_keys or {}
    )


@router.put("", response_model=SettingsSchema)
async def update_settings(
    payload: SettingsSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the authenticated user's AI provider preference and BYOK keys in Neon DB.
    """
    current_user.default_ai_provider = payload.default_ai_provider
    current_user.ai_keys = payload.ai_keys

    await db.commit()
    await db.refresh(current_user)

    return SettingsSchema(
        default_ai_provider=current_user.default_ai_provider,
        ai_keys=current_user.ai_keys or {}
    )
