# MediNexus Telemedicine Platform

Full-stack project: React (Vite + Tailwind) frontend + FastAPI backend, using
the free Groq API for all AI features (symptom checker, triage, report
summaries/chat, prescription safety review, clinical AI review, X-ray
analysis) and free Jitsi Meet for video consultations. No paid services
required.

## 1. Backend setup (telemedicine-backend/)

cd telemedicine-backend
pip install -r requirements.txt --break-system-packages   # or use a venv
cp .env.example .env

Edit .env and add your free Groq API key (get one at
https://console.groq.com - no credit card needed):

GROQ_API_KEY=your_key_here

Run the server:

uvicorn app.main:app --reload --port 8000

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health
- Database: SQLite file telemedicine.db, created automatically on first run.

## 2. Frontend setup (telemedicine-frontend/)

cd telemedicine-frontend
npm install
npm run dev

Open http://localhost:5173. The frontend talks to the backend at
http://localhost:8000 by default (see src/services/api.js). To point it
somewhere else, create a .env file with:

VITE_API_URL=http://your-backend-url

## 3. Using the app

1. Go to the login page and click "Create an account". Register once as a
   patient and once as a doctor (pick a specialty) to try both sides.
2. As a patient: Symptom Checker -> Triage Summary -> Find Doctor -> Book
   Appointment -> Video Consultation (real Jitsi call) -> Upload Report ->
   Report Summary -> Report Chat.
3. As a doctor: Doctor Dashboard shows your real booked appointments.
   Prescription Safety Review, X-ray Analysis, and Clinical AI Review all
   have a "Run AI" button that calls the real Groq-powered backend.
4. Register a third account with role "admin" to see /admin-dashboard
   with live patient/doctor/appointment counts.

## What's wired to the real backend

Everything. Every page in this app now reads and writes real data through the
FastAPI backend - there is no remaining front-end-only demo data:

- Login/Register (with age/gender/allergies for patients, specialty for doctors)
- Symptom Checker, Triage Summary (real Groq AI)
- Find Doctor, Book Appointment (real doctor list, real bookings, real room IDs)
- Video Consultation (real Jitsi Meet call using the booking's room ID)
- Report Upload/Summary/Chat (real file upload, text extraction, Groq AI)
- Prescription Safety AI check, X-ray AI analysis, Clinical AI review (real Groq calls)
- Messages (real per-appointment conversations, stored and fetched from the database)
- Notifications (built live from your real appointments and reports)
- Settings (view and edit your real profile; patients can set age/gender/allergies)
- Admin stats (live counts from the database)
- Doctor Dashboard (real appointment schedule)
- Patient Dashboard (real greeting, real upcoming appointments, real record/report counts)
- Health Records (real list; shows a few sample rows only if you have zero real records yet, so a brand-new account isn't a blank page)
- Patient Clinical Workspace: real patient list (anyone who's booked with you), a
  real per-patient clinical snapshot you can edit, a real timeline built from
  that patient's actual appointments/reports/health records/test
  orders/care plans, real "order test" and "send care plan" actions, and a
  real Groq-generated AI clinical brief button.

## Notes on the free services used

- Groq (https://console.groq.com): free tier, very fast inference, used
  for every AI feature. Vision model (llama-3.2-90b-vision-preview) powers
  the X-ray analysis - this is a general-purpose vision model giving an
  educational/preliminary read, NOT a certified diagnostic radiology
  tool. Always show it alongside a real doctor's review.
- Jitsi Meet (meet.jit.si): free, open-source video calling, no
  account or API key needed. Each appointment gets its own room ID.
- SQLite: file-based database, no server or account needed. For
  production you'd swap DATABASE_URL in .env for Postgres/MySQL.
