from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/patients", tags=["patients"])


def _ensure_doctor_has_patient(doctor_id: int, patient_id: int, db: Session):
    """A doctor may only view/edit a patient they have at least one appointment with."""
    exists = (
        db.query(models.Appointment)
        .filter(models.Appointment.doctor_id == doctor_id, models.Appointment.patient_id == patient_id)
        .first()
    )
    if not exists:
        raise HTTPException(status_code=403, detail="You don't have any appointment with this patient")


@router.get("/mine", response_model=List[schemas.PatientListOut])
def list_my_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.doctor_id == current_user.id)
        .order_by(models.Appointment.scheduled_time.desc())
        .all()
    )
    seen = {}
    for a in appts:
        if a.patient_id not in seen:
            seen[a.patient_id] = a.scheduled_time
    result = []
    for patient_id, last_visit in seen.items():
        patient = db.query(models.User).filter(models.User.id == patient_id).first()
        if patient:
            result.append(
                schemas.PatientListOut(
                    id=patient.id,
                    full_name=patient.full_name,
                    age=patient.age,
                    gender=patient.gender,
                    allergies=patient.allergies,
                    last_visit=last_visit,
                )
            )
    return result


@router.get("/{patient_id}/detail", response_model=schemas.PatientDetailOut)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Either the doctor treating this patient, or the patient themself, can view this
    if current_user.role == "doctor":
        _ensure_doctor_has_patient(current_user.id, patient_id, db)
    elif current_user.role != "admin" and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")

    patient = db.query(models.User).filter(models.User.id == patient_id, models.User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    last_appt = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient_id)
        .order_by(models.Appointment.scheduled_time.desc())
        .first()
    )

    snapshot = db.query(models.ClinicalSnapshot).filter(models.ClinicalSnapshot.patient_id == patient_id).first()
    if not snapshot:
        snapshot = models.ClinicalSnapshot(patient_id=patient_id)
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

    test_orders = (
        db.query(models.TestOrder)
        .filter(models.TestOrder.patient_id == patient_id)
        .order_by(models.TestOrder.created_at.desc())
        .all()
    )
    care_plans = (
        db.query(models.CarePlan)
        .filter(models.CarePlan.patient_id == patient_id)
        .order_by(models.CarePlan.created_at.desc())
        .all()
    )
    reports = db.query(models.Report).filter(models.Report.patient_id == patient_id).all()
    records = db.query(models.HealthRecord).filter(models.HealthRecord.patient_id == patient_id).all()
    appointments = db.query(models.Appointment).filter(models.Appointment.patient_id == patient_id).all()

    timeline = []
    for r in reports:
        timeline.append(
            schemas.TimelineItemOut(
                id=f"report-{r.id}",
                date=r.created_at,
                kind="report",
                title=r.filename,
                sub="AI summary ready" if r.summary else "Awaiting AI summary",
                route="/report-summary",
            )
        )
    for hr in records:
        timeline.append(
            schemas.TimelineItemOut(
                id=f"record-{hr.id}",
                date=hr.created_at,
                kind="health_record",
                title=hr.title,
                sub=hr.record_type,
                detail=hr.content,
            )
        )
    for t in test_orders:
        timeline.append(
            schemas.TimelineItemOut(
                id=f"test-{t.id}",
                date=t.created_at,
                kind="test_order",
                title=f"{t.test_type} ordered",
                sub=t.status,
                detail=t.note,
            )
        )
    for c in care_plans:
        timeline.append(
            schemas.TimelineItemOut(
                id=f"careplan-{c.id}",
                date=c.created_at,
                kind="care_plan",
                title="Care plan sent",
                sub="From your doctor",
                detail=c.plan_text,
            )
        )
    for a in appointments:
        timeline.append(
            schemas.TimelineItemOut(
                id=f"appt-{a.id}",
                date=a.scheduled_time,
                kind="appointment",
                title="Consultation",
                sub=a.reason or a.status,
            )
        )
    timeline.sort(key=lambda t: t.date, reverse=True)

    return schemas.PatientDetailOut(
        patient=schemas.PatientListOut(
            id=patient.id,
            full_name=patient.full_name,
            age=patient.age,
            gender=patient.gender,
            allergies=patient.allergies,
            last_visit=last_appt.scheduled_time if last_appt else None,
        ),
        snapshot=snapshot,
        timeline=timeline,
        test_orders=test_orders,
        care_plans=care_plans,
    )


@router.put("/{patient_id}/snapshot", response_model=schemas.ClinicalSnapshotOut)
def update_snapshot(
    patient_id: int,
    payload: schemas.ClinicalSnapshotIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    _ensure_doctor_has_patient(current_user.id, patient_id, db)
    snapshot = db.query(models.ClinicalSnapshot).filter(models.ClinicalSnapshot.patient_id == patient_id).first()
    if not snapshot:
        snapshot = models.ClinicalSnapshot(patient_id=patient_id)
        db.add(snapshot)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(snapshot, field, value)
    db.commit()
    db.refresh(snapshot)
    return snapshot


@router.post("/{patient_id}/test-orders", response_model=schemas.TestOrderOut)
def create_test_order(
    patient_id: int,
    payload: schemas.TestOrderIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    _ensure_doctor_has_patient(current_user.id, patient_id, db)
    order = models.TestOrder(
        patient_id=patient_id,
        doctor_id=current_user.id,
        test_type=payload.test_type,
        note=payload.note,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{patient_id}/care-plan", response_model=schemas.CarePlanOut)
def create_care_plan(
    patient_id: int,
    payload: schemas.CarePlanIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    _ensure_doctor_has_patient(current_user.id, patient_id, db)
    plan = models.CarePlan(
        patient_id=patient_id,
        doctor_id=current_user.id,
        plan_text=payload.plan_text,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
