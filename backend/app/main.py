from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle startup and shutdown events for the application.
    """
    # Initialize database tables and start-up routines
    # We will import create_db_and_tables from app.database in the next step
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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """
    Health check endpoint to verify that the API is running.
    """
    return {"status": "ok"}
