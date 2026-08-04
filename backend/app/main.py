"""
FastAPI Application Entrypoint for ATS Nexus (ATS CV Maker & Checker)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.checker import router as checker_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.profile import router as profile_router
from app.api.v1.settings import router as settings_router

from app.config import CORS_ORIGINS

from app.db.base import init_db

app = FastAPI(
    title="ATS Nexus API",
    description="Multi-Tenant Backend API for ATS CV Maker & Checker with Groq/Nvidia/Gemini support & Neon DB",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Configure CORS dynamically from environment configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(checker_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ATS Nexus API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
