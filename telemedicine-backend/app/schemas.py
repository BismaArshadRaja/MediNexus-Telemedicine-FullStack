from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ---------- Auth ----------
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"  # patient | doctor | admin
    specialty: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    specialty: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Appointments ----------
class AppointmentCreate(BaseModel):
    doctor_id: int
    scheduled_time: datetime
    reason: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    scheduled_time: datetime
    reason: Optional[str]
    status: str
    room_id: Optional[str]
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Health Records ----------
class HealthRecordCreate(BaseModel):
    title: str
    record_type: str = "note"
    content: Optional[str] = None


class HealthRecordOut(BaseModel):
    id: int
    title: str
    record_type: str
    content: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Symptom Checker / Chat ----------
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ---------- Triage ----------
class TriageOut(BaseModel):
    urgency_level: str
    recommendation: str
    symptoms_summary: str


# ---------- Reports ----------
class ReportOut(BaseModel):
    id: int
    filename: str
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReportSummaryOut(BaseModel):
    report_id: int
    summary: str


# ---------- Prescription Safety ----------
class PrescriptionCheckRequest(BaseModel):
    medications: str  # newline or comma separated list
    patient_context: Optional[str] = None


class PrescriptionCheckOut(BaseModel):
    risk_level: str
    safety_review: str


# ---------- Clinical AI Review ----------
class ClinicalNoteRequest(BaseModel):
    patient_id: int
    note_text: str


class ClinicalNoteOut(BaseModel):
    ai_review: str


# ---------- Doctor ----------
class DoctorOut(BaseModel):
    id: int
    full_name: str
    specialty: Optional[str]

    class Config:
        from_attributes = True


# ---------- Messages ----------
class MessageCreate(BaseModel):
    receiver_id: int
    content: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    other_user_id: int
    other_user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int


# ---------- Profile update ----------
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    specialty: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None


# ---------- Patient clinical workspace ----------
class PatientListOut(BaseModel):
    id: int
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None
    last_visit: Optional[datetime] = None


class ClinicalSnapshotIn(BaseModel):
    blood_group: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medicines: Optional[str] = None
    last_bp: Optional[str] = None
    last_glucose: Optional[str] = None
    smoking: Optional[str] = None


class ClinicalSnapshotOut(ClinicalSnapshotIn):
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TestOrderIn(BaseModel):
    test_type: str
    note: Optional[str] = None


class TestOrderOut(BaseModel):
    id: int
    test_type: str
    note: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CarePlanIn(BaseModel):
    plan_text: str


class CarePlanOut(BaseModel):
    id: int
    plan_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class TimelineItemOut(BaseModel):
    id: str
    date: datetime
    kind: str  # report | health_record | test_order | care_plan | appointment
    title: str
    sub: str
    route: Optional[str] = None
    detail: Optional[str] = None


class PatientDetailOut(BaseModel):
    patient: PatientListOut
    snapshot: ClinicalSnapshotOut
    timeline: List[TimelineItemOut]
    test_orders: List[TestOrderOut]
    care_plans: List[CarePlanOut]


# ---------- Triage history ----------
class TriageHistoryOut(BaseModel):
    id: int
    symptoms_summary: str
    urgency_level: str
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True
