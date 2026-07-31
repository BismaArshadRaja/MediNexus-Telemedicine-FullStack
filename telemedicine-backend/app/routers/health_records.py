from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/health-records", tags=["health-records"])


@router.post("/", response_model=schemas.HealthRecordOut)
def create_record(
    payload: schemas.HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    record = models.HealthRecord(
        patient_id=current_user.id,
        title=payload.title,
        record_type=payload.record_type,
        content=payload.content,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[schemas.HealthRecordOut])
def list_records(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.HealthRecord)
        .filter(models.HealthRecord.patient_id == current_user.id)
        .order_by(models.HealthRecord.created_at.desc())
        .all()
    )
