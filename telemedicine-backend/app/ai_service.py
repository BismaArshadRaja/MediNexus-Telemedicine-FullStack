"""
Thin wrapper around the free Groq API (https://console.groq.com).
Groq gives a generous free tier and very fast inference, no credit card needed.
All clinical-AI endpoints in this app go through here.
"""
from groq import Groq
from app.config import settings

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY not set. Get a free key at https://console.groq.com and put it in your .env file."
            )
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


MODEL = "llama-3.3-70b-versatile"

SAFETY_NOTE = (
    "You are a clinical decision-support assistant inside a telemedicine app. "
    "You are NOT a replacement for a licensed doctor. Always include a brief reminder "
    "that a qualified physician should confirm any diagnosis or treatment. "
    "Never state a definitive diagnosis; speak in terms of possibilities and next steps."
)


def chat_completion(system_prompt: str, user_message: str, history: list[dict] | None = None) -> str:
    client = get_client()
    messages = [{"role": "system", "content": f"{system_prompt}\n\n{SAFETY_NOTE}"}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.4,
        max_tokens=800,
    )
    return response.choices[0].message.content


def symptom_checker_reply(message: str, history: list[dict]) -> str:
    system_prompt = (
        "You are a friendly symptom-checker assistant. Ask clarifying questions about "
        "duration, severity, and associated symptoms when needed. Keep answers concise "
        "and easy to understand for a layperson."
    )
    return chat_completion(system_prompt, message, history)


def generate_triage(symptoms_summary: str) -> dict:
    system_prompt = (
        "Given a patient's described symptoms, classify urgency as one of: "
        "low, moderate, high, emergency. Then give a short recommendation "
        "(e.g. self-care, book a routine appointment, see a doctor within 24 hours, "
        "go to the ER immediately). "
        "Respond ONLY in this exact format:\n"
        "URGENCY: <level>\nRECOMMENDATION: <one or two sentences>"
    )
    raw = chat_completion(system_prompt, symptoms_summary)
    urgency = "moderate"
    recommendation = raw
    for line in raw.splitlines():
        if line.upper().startswith("URGENCY:"):
            urgency = line.split(":", 1)[1].strip().lower()
        elif line.upper().startswith("RECOMMENDATION:"):
            recommendation = line.split(":", 1)[1].strip()
    return {"urgency_level": urgency, "recommendation": recommendation}


def summarize_report(report_text: str) -> str:
    system_prompt = (
        "Summarize this medical report for a patient in plain, simple language. "
        "Highlight key findings, any abnormal values, and suggested follow-up. "
        "Use short bullet points."
    )
    return chat_completion(system_prompt, report_text)


def report_chat_reply(report_text: str, question: str, history: list[dict]) -> str:
    system_prompt = (
        "Answer the patient's question ONLY using the information in the following medical report. "
        "If the answer isn't in the report, say so clearly.\n\n"
        f"--- REPORT TEXT ---\n{report_text}\n--- END REPORT ---"
    )
    return chat_completion(system_prompt, question, history)


def check_prescription_safety(medications: str, patient_context: str | None) -> dict:
    system_prompt = (
        "You are reviewing a list of medications for potential interactions, duplicate "
        "therapy, or dosage concerns. Classify overall risk as one of: safe, caution, danger. "
        "Respond in this exact format:\n"
        "RISK: <level>\nREVIEW: <detailed explanation with bullet points of any concerns found>"
    )
    context = f"Patient context: {patient_context}\n\n" if patient_context else ""
    raw = chat_completion(system_prompt, f"{context}Medications:\n{medications}")
    risk = "caution"
    review = raw
    for line in raw.splitlines():
        if line.upper().startswith("RISK:"):
            risk = line.split(":", 1)[1].strip().lower()
        elif line.upper().startswith("REVIEW:"):
            review = line.split(":", 1)[1].strip()
    return {"risk_level": risk, "safety_review": review}


def analyze_xray(image_base64: str, mime_type: str = "image/jpeg") -> str:
    """
    Uses a free Groq vision model to give a preliminary, educational description
    of an X-ray image. This is NOT a diagnostic tool and must always be reviewed
    by a radiologist / licensed doctor.
    """
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.2-90b-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are assisting a doctor by giving a preliminary, educational "
                            "description of this X-ray image: general positioning, visible "
                            "structures, and anything that looks like it may need closer review. "
                            "Do NOT give a definitive diagnosis. Clearly state this is an AI-assisted "
                            "preliminary read that must be confirmed by a radiologist."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                    },
                ],
            }
        ],
        temperature=0.3,
        max_tokens=700,
    )
    return response.choices[0].message.content


def clinical_ai_review(note_text: str) -> str:
    system_prompt = (
        "You are assisting a doctor by reviewing their clinical notes. Point out any "
        "missing information, inconsistencies, possible differential diagnoses worth "
        "considering, and relevant red flags. Be concise and use bullet points."
    )
    return chat_completion(system_prompt, note_text)
