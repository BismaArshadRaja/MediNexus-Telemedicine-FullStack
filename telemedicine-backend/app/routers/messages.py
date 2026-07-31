from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/messages", tags=["messages"])


def _contacts_for(current_user: models.User, db: Session) -> list[models.User]:
    """A patient can message any doctor they have an appointment with, and vice versa."""
    if current_user.role == "doctor":
        rows = db.query(models.Appointment).filter(models.Appointment.doctor_id == current_user.id).all()
        ids = {r.patient_id for r in rows}
    else:
        rows = db.query(models.Appointment).filter(models.Appointment.patient_id == current_user.id).all()
        ids = {r.doctor_id for r in rows}
    if not ids:
        return []
    return db.query(models.User).filter(models.User.id.in_(ids)).all()


@router.get("/conversations", response_model=List[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    contacts = _contacts_for(current_user, db)
    result = []
    for contact in contacts:
        last = (
            db.query(models.Message)
            .filter(
                or_(
                    and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == contact.id),
                    and_(models.Message.sender_id == contact.id, models.Message.receiver_id == current_user.id),
                )
            )
            .order_by(models.Message.created_at.desc())
            .first()
        )
        unread = (
            db.query(models.Message)
            .filter(
                models.Message.sender_id == contact.id,
                models.Message.receiver_id == current_user.id,
                models.Message.read == False,  # noqa: E712
            )
            .count()
        )
        result.append(
            schemas.ConversationOut(
                other_user_id=contact.id,
                other_user_name=contact.full_name,
                last_message=last.content if last else "No messages yet - say hello!",
                last_message_at=last.created_at if last else contact.created_at,
                unread_count=unread,
            )
        )
    return sorted(result, key=lambda c: c.last_message_at, reverse=True)


@router.get("/{other_user_id}", response_model=List[schemas.MessageOut])
def get_thread(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    messages = (
        db.query(models.Message)
        .filter(
            or_(
                and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == other_user_id),
                and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == current_user.id),
            )
        )
        .order_by(models.Message.created_at)
        .all()
    )
    # mark incoming messages as read
    for m in messages:
        if m.receiver_id == current_user.id and not m.read:
            m.read = True
    db.commit()
    return messages


@router.post("/", response_model=schemas.MessageOut)
def send_message(
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    receiver = db.query(models.User).filter(models.User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    message = models.Message(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
