import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def _with_names(appt: models.Appointment, db: Session) -> models.Appointment:
    appt.patient_name = appt.patient.full_name if appt.patient else None
    appt.doctor_name = appt.doctor.full_name if appt.doctor else None
    return appt


@router.post("/", response_model=schemas.AppointmentOut)
def book_appointment(
    payload: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    doctor = db.query(models.User).filter(models.User.id == payload.doctor_id, models.User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appointment = models.Appointment(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        scheduled_time=payload.scheduled_time,
        reason=payload.reason,
        room_id=str(uuid.uuid4())[:8],
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return _with_names(appointment, db)


@router.get("/mine", response_model=List[schemas.AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == "doctor":
        rows = db.query(models.Appointment).filter(models.Appointment.doctor_id == current_user.id).all()
    else:
        rows = db.query(models.Appointment).filter(models.Appointment.patient_id == current_user.id).all()
    return [_with_names(r, db) for r in rows]


@router.get("/{appointment_id}/room", response_model=dict)
def get_video_room(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.id not in (appt.patient_id, appt.doctor_id):
        raise HTTPException(status_code=403, detail="Not your appointment")
    return {"room_id": appt.room_id}
