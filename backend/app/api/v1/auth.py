"""
Authentication Endpoints (Register, Login, Me)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models.user import User
from app.db.models.profile import MasterProfile
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    default_ai_provider: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account and initialize their tenant Master Profile.
    """
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    try:
        # Create User
        new_user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name
        )
        db.add(new_user)
        await db.flush()

        # Create empty MasterProfile for tenant
        profile = MasterProfile(user_id=new_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

    # Issue JWT token
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})

    user_data = UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        default_ai_provider=new_user.default_ai_provider or "gemini"
    )

    return TokenResponse(access_token=access_token, user=user_data)


@router.post("/login", response_model=TokenResponse)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Authenticate user via OAuth2 Form (username=email, password=password) and issue JWT token.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})

    user_data = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        default_ai_provider=user.default_ai_provider or "gemini"
    )

    return TokenResponse(access_token=access_token, user=user_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user profile details.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        default_ai_provider=current_user.default_ai_provider or "gemini"
    )
