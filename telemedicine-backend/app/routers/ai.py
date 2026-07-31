import base64
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth, ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/symptom-checker", response_model=schemas.ChatResponse)
def symptom_checker(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session_id = payload.session_id or f"symptom_checker_{current_user.id}"
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    history = [{"role": row.role, "content": row.content} for row in history_rows]

    reply = ai_service.symptom_checker_reply(payload.message, history)

    db.add(models.ChatMessage(session_id=session_id, role="user", content=payload.message))
    db.add(models.ChatMessage(session_id=session_id, role="assistant", content=reply))
    db.commit()

    return {"reply": reply, "session_id": session_id}


@router.post("/triage-summary", response_model=schemas.TriageOut)
def triage_summary(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    result = ai_service.generate_triage(payload.message)

    triage = models.TriageResult(
        patient_id=current_user.id,
        symptoms_summary=payload.message,
        urgency_level=result["urgency_level"],
        recommendation=result["recommendation"],
    )
    db.add(triage)
    db.commit()

    return {
        "urgency_level": result["urgency_level"],
        "recommendation": result["recommendation"],
        "symptoms_summary": payload.message,
    }


@router.get("/triage-history", response_model=list[schemas.TriageHistoryOut])
def triage_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.TriageResult)
        .filter(models.TriageResult.patient_id == current_user.id)
        .order_by(models.TriageResult.created_at.desc())
        .all()
    )


@router.post("/prescription-safety", response_model=schemas.PrescriptionCheckOut)
def prescription_safety(
    payload: schemas.PrescriptionCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor", "admin")),
):
    result = ai_service.check_prescription_safety(payload.medications, payload.patient_context)

    prescription = models.Prescription(
        patient_id=0,  # optionally link a real patient id from the frontend later
        doctor_id=current_user.id,
        medications=payload.medications,
        safety_review=result["safety_review"],
        risk_level=result["risk_level"],
    )
    db.add(prescription)
    db.commit()

    return result


@router.post("/clinical-review", response_model=schemas.ClinicalNoteOut)
def clinical_review(
    payload: schemas.ClinicalNoteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor", "admin")),
):
    ai_review = ai_service.clinical_ai_review(payload.note_text)

    note = models.ClinicalNote(
        patient_id=payload.patient_id,
        doctor_id=current_user.id,
        note_text=payload.note_text,
        ai_review=ai_review,
    )
    db.add(note)
    db.commit()

    return {"ai_review": ai_review}


@router.post("/xray-analysis")
def xray_analysis(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    image_bytes = file.file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    mime_type = file.content_type or "image/jpeg"

    analysis = ai_service.analyze_xray(image_b64, mime_type)
    return {"analysis": analysis}
