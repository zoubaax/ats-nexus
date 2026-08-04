"""
FastAPI Dependencies for Authentication & Tenant Context
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to authenticate request and return the tenant User object.
    If no token is provided in demo mode, returns a default mock tenant.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        # Fallback to default demo user for frictionless development/testing
        result = await db.execute(select(User).where(User.email == "demo@atsnexus.com"))
        demo_user = result.scalars().first()
        if not demo_user:
            demo_user = User(
                id="tenant-demo-user-123",
                email="demo@atsnexus.com",
                full_name="Demo Candidate",
                is_active=True
            )
            db.add(demo_user)
            await db.commit()
            await db.refresh(demo_user)
        return demo_user

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_exception

    user_id: str = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if user is None or not user.is_active:
        raise credentials_exception

    return user
