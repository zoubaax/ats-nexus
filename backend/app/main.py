"""
FastAPI Application Entrypoint for ATS Nexus (ATS CV Maker & Checker)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ATS Nexus API",
    description="Backend API for ATS CV Maker & Checker with Multi-LLM support and Neon DB",
    version="1.0.0"
)

# Configure CORS for Frontend React app connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ATS Nexus API",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
