import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth, ai_service

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _extract_text(path: str, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            return "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception:
            return ""
    try:
        with open(path, "r", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


@router.post("/upload", response_model=schemas.ReportOut)
def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(file.file.read())

    extracted_text = _extract_text(path, file.filename)

    report = models.Report(
        patient_id=current_user.id,
        filename=file.filename,
        extracted_text=extracted_text,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=List[schemas.ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Report)
        .filter(models.Report.patient_id == current_user.id)
        .order_by(models.Report.created_at.desc())
        .all()
    )


@router.post("/{report_id}/summarize", response_model=schemas.ReportSummaryOut)
def summarize_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id, models.Report.patient_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if not report.extracted_text:
        raise HTTPException(status_code=400, detail="No text could be extracted from this report")

    summary = ai_service.summarize_report(report.extracted_text)
    report.summary = summary
    db.commit()
    return {"report_id": report.id, "summary": summary}


@router.post("/{report_id}/chat", response_model=schemas.ChatResponse)
def chat_about_report(
    report_id: int,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id, models.Report.patient_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    session_id = payload.session_id or f"report_chat_{report_id}"
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    history = [{"role": row.role, "content": row.content} for row in history_rows]

    reply = ai_service.report_chat_reply(report.extracted_text or "", payload.message, history)

    db.add(models.ChatMessage(session_id=session_id, role="user", content=payload.message))
    db.add(models.ChatMessage(session_id=session_id, role="assistant", content=reply))
    db.commit()

    return {"reply": reply, "session_id": session_id}
