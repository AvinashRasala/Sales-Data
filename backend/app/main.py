from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.db import init_db
from app.routers import upload, dashboard, forecast, insights, datasets

app = FastAPI(
    title="AI Business Intelligence Platform",
    description="Upload sales data, get cleaning, dashboards, forecasts, and AI-generated insights.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(forecast.router)
app.include_router(insights.router)
app.include_router(datasets.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"status": "ok", "service": "ai-bi-platform-backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
