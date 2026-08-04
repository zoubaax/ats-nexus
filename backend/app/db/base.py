"""
Database Connection & Session Setup for Neon PostgreSQL using Async SQLAlchemy
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Ensure backend .env is loaded
load_dotenv(Path(__file__).parent.parent.parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/ats_nexus"
)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

import re

needs_ssl = "sslmode=" in DATABASE_URL or "neon.tech" in DATABASE_URL

# Remove libpq parameters not recognized by asyncpg (like sslmode, channel_binding)
DATABASE_URL = re.sub(r"[&?]sslmode=[^&]+", "", DATABASE_URL)
DATABASE_URL = re.sub(r"[&?]channel_binding=[^&]+", "", DATABASE_URL)

connect_args = {}
if needs_ssl:
    import ssl
    ssl_ctx = ssl.create_default_context()
    connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db():
    """Dependency for providing asynchronous database sessions per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initializes all database tables automatically."""
    try:
        import app.db.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Neon PostgreSQL tables initialized successfully!")
    except Exception as e:
        print(f"Database initialization error (Check DATABASE_URL): {e}")

