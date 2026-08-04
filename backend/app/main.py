"""
FastAPI Application Entrypoint for ATS Nexus (ATS CV Maker & Checker)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.checker import router as checker_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.profile import router as profile_router

app = FastAPI(
    title="ATS Nexus API",
    description="Multi-Tenant Backend API for ATS CV Maker & Checker with Groq/Nvidia/Gemini support & Neon DB",
    version="1.0.0"
)

# Configure CORS for Frontend React app connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(checker_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")


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
