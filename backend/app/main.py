from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.db.dynamo.client import bootstrap_table
from app.services.scheduler import start_scheduler
from app.api.routes import auth, logs, attendance, tasks, expenses, stipends, dashboard,leaves,wfh,projects,relievings, complaints,kt, reports

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    bootstrap_table()
    scheduler = start_scheduler()
    yield
    # Shutdown
    scheduler.shutdown()


app = FastAPI(
    title="Intern Management System",
    description="Complete IMS with FastAPI backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Allow both localhost and production domain
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://xetasolutions.in",
    "https://www.xetasolutions.in"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(stipends.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(leaves.router, prefix="/api")
app.include_router(wfh.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(relievings.router, prefix="/api")  # ADD
app.include_router(complaints.router, prefix="/api")
app.include_router(kt.router, prefix="/api")  # ADD
app.include_router(reports.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Intern Management System API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "service": "IMS API"
    }


# Mount static files (React frontend build)
# This should be last so it doesn't interfere with API routes
static_dir = Path(__file__).parent.parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
