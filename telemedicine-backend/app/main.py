from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import auth, doctors, appointments, health_records, reports, ai, admin, messages, patients

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediNexus Telemedicine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(health_records.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(messages.router)
app.include_router(patients.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "MediNexus Telemedicine backend is running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
