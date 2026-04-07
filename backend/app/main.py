"""
Main entry point for the Selfynk API application.
Handles application initialization, middleware setup, and base routing.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables
from app.routers import analysis, input, onboarding


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """
    Handle startup and shutdown events for the application.
    """
    # Initialize database tables and start-up routines
    create_db_and_tables()
    yield
    # Cleanup routines


app = FastAPI(
    title="Selfynk",
    description="AI-powered Personal Brand Operating System API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(input.router)
app.include_router(analysis.router)
app.include_router(onboarding.router)


@app.get("/health")
async def health() -> dict[str, str]:
    """
    Health check endpoint to verify that the API is running.
    """
    return {"status": "ok"}
