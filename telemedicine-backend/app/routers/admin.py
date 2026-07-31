from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user=Depends(auth.require_role("admin")),
):
    return {
        "total_patients": db.query(models.User).filter(models.User.role == "patient").count(),
        "total_doctors": db.query(models.User).filter(models.User.role == "doctor").count(),
        "total_appointments": db.query(models.Appointment).count(),
        "total_reports": db.query(models.Report).count(),
        "total_prescriptions_reviewed": db.query(models.Prescription).count(),
    }
