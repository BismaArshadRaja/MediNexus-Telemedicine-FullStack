import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bot,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: CalendarDays, label: "Appointments", active: true, route: "/find-doctor" },
  { icon: FileText, label: "Health Records", route: "/health-records" },
  { icon: Bot, label: "AI Assistant", route: "/symptom-checker" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const defaultDoctor = {
  initials: "SM",
  avatarBg: "#CCFBF1",
  avatarText: "#115E59",
  name: "Dr. Sana Malik",
  specialty: "General Medicine",
  details: [
    "MBBS, FCPS",
    "8 years experience",
    "Urdu, English",
    "Video consultation",
    "Fee: Rs 1,500",
  ],
  fee: 1500,
};

const timeSlots = [
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "3:30 PM",
  "5:00 PM",
  "7:00 PM",
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function SidebarContent() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500 flex items-center justify-center font-bold shadow-lg shadow-teal-500/20">
          M+
        </div>
        <div>
          <p className="font-bold leading-tight">MediNexus</p>
          <p className="text-xs text-slate-400 leading-tight">
            AI Telemedicine
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ icon: Icon, label, active, route }) => (
          <button
            key={label}
            onClick={() => route && navigate(route)}
            disabled={!route}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/10 text-white"
                : route
                ? "text-slate-400 hover:text-white hover:bg-white/5"
                : "text-slate-600 cursor-not-allowed"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-teal-400" : "bg-slate-600"
              }`}
            />
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

function getCalendarWeeks(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();

  // JS getDay(): 0=Sun..6=Sat. We want Mon-first index: 0=Mon..6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  // Passed from FindDoctor's "Book" button: { doctorId, doctorName, doctorInitials }
  const passedDoctor = location.state || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [appointmentResult, setAppointmentResult] = useState(null);
  const doctor = {
    ...defaultDoctor,
    name: passedDoctor.doctorName || defaultDoctor.name,
    initials: passedDoctor.doctorInitials || defaultDoctor.initials,
    specialty: passedDoctor.doctorSpecialty || defaultDoctor.specialty,
  };
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(6); // July = 6
  const [selectedDate, setSelectedDate] = useState(12);
  const [selectedTime, setSelectedTime] = useState("3:30 PM");
  const [reason, setReason] = useState(
    "Fever, sore throat and body aches for two days."
  );
  const [confirmed, setConfirmed] = useState(false);

  const weeks = useMemo(
    () => getCalendarWeeks(year, monthIndex),
    [year, monthIndex]
  );

  const goPrevMonth = () => {
    setSelectedDate(null);
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    setSelectedDate(null);
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex((m) => m + 1);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    if (!passedDoctor.doctorId) {
      setBookingError("Please pick a doctor from Find Doctor first.");
      return;
    }
    setBooking(true);
    setBookingError("");
    try {
      // Convert the picker's 12-hour time label (e.g. "3:30 PM") into 24-hour parts
      const [time, period] = selectedTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const scheduledTime = new Date(year, monthIndex, selectedDate, hours, minutes);

      const { data } = await api.post("/api/appointments/", {
        doctor_id: passedDoctor.doctorId,
        scheduled_time: scheduledTime.toISOString(),
        reason,
      });
      setAppointmentResult(data);
      setConfirmed(true);
    } catch (err) {
      setBookingError(err?.response?.data?.detail || "Couldn't book the appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

  return (
    <div className="min-h-screen w-full max-w-full flex bg-slate-50 font-sans overflow-x-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col bg-[#0b1220] text-white px-4 py-6">
        <SidebarContent />
      </aside>

      {/* MOBILE / TABLET DRAWER SIDEBAR */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-[#0b1220] text-white px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wide text-slate-400 px-2">
                Menu
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        {/* TOP BAR */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 truncate">
              Book Appointment
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              PA
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Patient Account
              </p>
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                Verified
              </p>
            </div>
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            PA
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 sm:gap-6 items-start">
            {/* DOCTOR CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Doctor
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Selected clinician
              </p>

              <div className="mt-5 flex flex-col items-center text-center">
                <div
                  style={{
                    backgroundColor: doctor.avatarBg,
                    color: doctor.avatarText,
                  }}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-extrabold"
                >
                  {doctor.initials}
                </div>
                <p className="mt-4 font-bold text-slate-900 text-lg sm:text-xl">
                  {doctor.name}
                </p>
                <p className="text-teal-700 font-semibold text-sm sm:text-base mt-0.5">
                  {doctor.specialty}
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {doctor.details.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BOOKING CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Select a time
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Timezone: Asia/Karachi
              </p>

              {/* CALENDAR */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="font-bold text-slate-900 text-sm sm:text-base">
                    {monthNames[monthIndex]} {year}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={goPrevMonth}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={goNextMonth}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                  {weekdays.map((d) => (
                    <p
                      key={d}
                      className="text-[10px] sm:text-xs font-semibold text-slate-400 pb-1 sm:pb-2"
                    >
                      {d}
                    </p>
                  ))}
                  {weeks.flat().map((day, idx) => (
                    <div key={idx} className="flex items-center justify-center">
                      {day ? (
                        <button
                          onClick={() => setSelectedDate(day)}
                          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs sm:text-sm font-semibold transition ${
                            selectedDate === day
                              ? "bg-teal-700 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {day}
                        </button>
                      ) : (
                        <span className="h-8 w-8 sm:h-10 sm:w-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AVAILABLE TIMES */}
              <div className="mt-6 sm:mt-7">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
                  Available times
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-lg border py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition ${
                        selectedTime === slot
                          ? "bg-teal-700 border-teal-700 text-white"
                          : "border-slate-300 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* REASON FOR VISIT */}
              <div className="mt-6 sm:mt-7">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
                  Reason for visit
                </h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for the visit"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* CONFIRM */}
              {bookingError && (
                <p className="mt-4 text-sm text-red-600">{bookingError}</p>
              )}
              <button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime || booking}
                className="mt-6 sm:mt-7 w-full rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm sm:text-base transition"
              >
                {booking ? "Booking..." : `Confirm appointment - Rs ${doctor.fee.toLocaleString()}`}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmed && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmed(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-[300px] sm:max-w-xs rounded-2xl bg-white p-5 sm:p-6 text-center shadow-xl">
            <div className="mx-auto h-11 w-11 rounded-full bg-teal-50 flex items-center justify-center">
              <Check className="h-5 w-5 text-teal-700" />
            </div>
            <p className="mt-3 font-bold text-slate-900 text-sm sm:text-base">
              Appointment confirmed
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {doctor.name} • {monthNames[monthIndex]} {selectedDate}, {year}{" "}
              at {selectedTime}
            </p>
            <button
              onClick={() =>
                navigate("/video-consultation", {
                  state: {
                    doctorName: doctor.name,
                    initials: doctor.initials,
                    roomId: appointmentResult?.room_id,
                  },
                })
              }
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Join video consultation
            </button>
            <button
              onClick={() => setConfirmed(false)}
              className="mt-2 w-full rounded-lg border border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}