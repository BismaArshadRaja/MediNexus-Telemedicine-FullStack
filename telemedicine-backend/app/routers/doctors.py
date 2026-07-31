from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("/", response_model=List[schemas.DoctorOut])
def list_doctors(specialty: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.User).filter(models.User.role == "doctor")
    if specialty:
        query = query.filter(models.User.specialty.ilike(f"%{specialty}%"))
    return query.all()
