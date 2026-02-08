"""
Care Bear - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from pathlib import Path
import uvicorn

from database import connect_to_mongo, close_mongo_connection
from routes import users, chat, calendar, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

# Initialize FastAPI app
app = FastAPI(
    title="Care Bear API",
    description="AI-powered health caretaker backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:5173",
        "http://localhost", "http://127.0.0.1"
    ],  # React / Vite dev servers and localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(health.router, prefix="/api/health", tags=["Health Records"])

# Attempt to serve a built frontend (frontend/dist) when present. This allows
# deploying the single repo where FastAPI serves the production build of the
# Vite/React frontend at the site root while keeping API routes under /api/*.
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    # If no built frontend exists, keep simple JSON root and health endpoints
    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint"""
        return {
            "message": "Welcome to Care Bear API",
            "version": "1.0.0",
            "status": "active"
        }

    @app.get("/health", tags=["Health Check"])
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "service": "care-bear-api"
        }

# Note: API routes remain under /api/* so they are not affected by the
# StaticFiles mount when a frontend build is present.

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
