import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  LayoutDashboard,
  Clock,
  Users,
  Stethoscope,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, route: "/doctor-dashboard" },
  { icon: Clock, label: "Schedule" },
  { icon: Users, label: "Patients", route: "/patient-clinical-workspace" },
  { icon: Stethoscope, label: "Consultations" },
  { icon: ShieldCheck, label: "Clinical AI", route: "/clinical-ai-review" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const statusCycle = ["Waiting", "Confirmed", "Completed"];
const statusStyles = {
  Waiting: "bg-amber-50 text-amber-700",
  Confirmed: "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const initialSchedule = [
  { id: 1, time: "09:00", patient: "Ali Raza", type: "Follow-up", status: "Completed" },
  { id: 2, time: "10:30", patient: "Maria Khan", type: "Lab review", status: "Completed" },
  { id: 3, time: "12:00", patient: "Usman Tariq", type: "Fever / cough", status: "Waiting" },
  { id: 4, time: "03:30", patient: "Ayesha Khan", type: "Sore throat", status: "Confirmed" },
  { id: 5, time: "05:00", patient: "Hina Ahmed", type: "Diabetes review", status: "Confirmed" },
];

const reviewQueue = [
  {
    id: 1,
    title: "Prescription",
    detail: "Ayesha Khan • 2 warnings",
    risk: "High",
    route: "/prescription-review",
  },
  {
    id: 2,
    title: "Chest X-ray",
    detail: "Raza Ali • 1 suspicious finding",
    risk: "High",
    route: "/xray-analysis",
  },
  {
    id: 3,
    title: "Lab report",
    detail: "Hina Ahmed • 3 abnormal values",
    risk: "Medium",
    route: null,
  },
  {
    id: 4,
    title: "Symptom triage",
    detail: "Sara Noor • Doctor within 24h",
    risk: "Medium",
    route: null,
  },
  {
    id: 5,
    title: "Lab report",
    detail: "Ali Raza • Routine follow-up",
    risk: "Low",
    route: null,
  },
];

const riskStyles = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700",
};

const patientMessages = [
  {
    id: 1,
    initials: "AK",
    name: "Ayesha Khan",
    preview: "Can I take the medicine after dinner?",
    time: "8 min",
    read: false,
    thread: [
      { from: "patient", text: "Can I take the medicine after dinner?" },
      { from: "patient", text: "I already ate about an hour ago." },
    ],
  },
  {
    id: 2,
    initials: "UT",
    name: "Usman Tariq",
    preview: "My fever increased to 39°C.",
    time: "14 min",
    read: false,
    thread: [
      { from: "patient", text: "My fever increased to 39°C." },
      { from: "patient", text: "Should I go to the ER or wait?" },
    ],
  },
  {
    id: 3,
    initials: "HA",
    name: "Hina Ahmed",
    preview: "Uploaded fasting glucose report.",
    time: "31 min",
    read: false,
    thread: [
      { from: "patient", text: "Uploaded fasting glucose report." },
      { from: "patient", text: "Let me know if it looks concerning." },
    ],
  },
];

const qualityStats = [
  { label: "AI suggestions accepted", value: "63%" },
  { label: "Modified before signing", value: "29%" },
  { label: "Rejected", value: "8%" },
  { label: "Median review time", value: "2m 14s" },
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

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [queue, setQueue] = useState(reviewQueue);
  const [messages, setMessages] = useState(patientMessages);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [noRouteNotice, setNoRouteNotice] = useState(null);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    api
      .get("/api/appointments/mine")
      .then(({ data }) => {
        const mapped = data.map((appt) => {
          const dt = new Date(appt.scheduled_time);
          return {
            id: appt.id,
            time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            patient: appt.patient_name || `Patient #${appt.patient_id}`,
            type: appt.reason || "Consultation",
            status: appt.status === "scheduled" ? "Confirmed" : appt.status,
            roomId: appt.room_id,
          };
        });
        setSchedule(mapped);
      })
      .catch(() => setScheduleError("Couldn't load your real appointments (showing demo data below)."));
  }, []);

  const waitingCount = schedule.filter((s) => s.status === "Waiting").length;
  const highPriorityCount = queue.filter((q) => q.risk === "High").length;
  const unreadCount = messages.filter((m) => !m.read).length;

  const statCards = useMemo(
    () => [
      {
        label: "Today's consultations",
        value: String(schedule.length),
        sub: `${waitingCount} waiting now`,
        subClass: "text-blue-700",
        dot: "bg-blue-600",
      },
      {
        label: "AI reviews pending",
        value: String(queue.length),
        sub: `${highPriorityCount} high priority`,
        subClass: "text-orange-600",
        dot: "bg-orange-500",
      },
      {
        label: "Unread messages",
        value: String(unreadCount),
        sub: `${unreadCount} from patients`,
        subClass: "text-teal-700",
        dot: "bg-teal-700",
      },
      {
        label: "Average wait",
        value: "7 min",
        sub: "Within target",
        subClass: "text-emerald-700",
        dot: "bg-emerald-500",
      },
    ],
    [schedule.length, waitingCount, queue.length, highPriorityCount, unreadCount]
  );

  const cycleStatus = (id) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextIdx =
          (statusCycle.indexOf(item.status) + 1) % statusCycle.length;
        return { ...item, status: statusCycle[nextIdx] };
      })
    );
  };

  const openReview = (item) => {
    if (item.route) {
      navigate(item.route);
    } else {
      setNoRouteNotice(item);
    }
  };

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
              Doctor Dashboard
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              DA
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Doctor Account
              </p>
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                Verified
              </p>
            </div>
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            DA
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-slate-500">
                    {card.label}
                  </p>
                  <span className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full ${card.dot}`} />
                </div>
                <p className="mt-2 sm:mt-3 font-extrabold text-slate-900 text-2xl sm:text-3xl">
                  {card.value}
                </p>
                <p className={`mt-1 text-xs sm:text-sm font-semibold ${card.subClass}`}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          {/* SCHEDULE + REVIEW QUEUE */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            {/* TODAY'S SCHEDULE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Today's schedule
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Live consultation queue • tap a status to update it
              </p>
              {scheduleError && (
                <p className="text-xs text-amber-600 mt-2">{scheduleError}</p>
              )}

              <div className="mt-4 divide-y divide-slate-100">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <span className="w-12 sm:w-14 shrink-0 text-xs font-bold text-teal-700 pt-0.5">
                        {item.time}
                      </span>
                      <span className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {item.patient}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          {item.type}
                        </p>
                      </span>
                    </div>
                    <button
                      onClick={() => cycleStatus(item.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition hover:brightness-95 ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CLINICAL AI REVIEW QUEUE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Clinical AI review queue
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Prioritized by risk and age
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {queue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openReview(item)}
                    className="w-full flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${riskStyles[item.risk]}`}
                    >
                      {item.risk}
                    </span>
                  </button>
                ))}
                {queue.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">
                    All caught up — no reviews pending.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MESSAGES + QUALITY */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            {/* PATIENT MESSAGES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Patient messages
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Recent conversations
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMessage(m);
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === m.id ? { ...msg, read: true } : msg
                        )
                      );
                    }}
                    className="w-full flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                  >
                    <span className="relative h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                      {m.initials}
                      {!m.read && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className={`text-sm ${m.read ? "font-semibold" : "font-bold"} text-slate-900`}>
                        {m.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                        {m.preview}
                      </p>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {m.time}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* QUALITY & SAFETY */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Quality &amp; safety
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Your last 30 days
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {qualityStats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <p className="text-sm text-slate-600">{s.label}</p>
                    <p className="font-bold text-slate-900 text-sm sm:text-base">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MESSAGE THREAD MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedMessage(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                {selectedMessage.initials}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm">
                  {selectedMessage.name}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedMessage.time} ago
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {selectedMessage.thread.map((msg, idx) => (
                <div
                  key={idx}
                  className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800"
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Full messaging isn't built yet — this is a preview of the
              conversation.
            </p>

            <button
              onClick={() => setSelectedMessage(null)}
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* NO ROUTE YET NOTICE */}
      {noRouteNotice && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNoRouteNotice(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 text-center shadow-xl">
            <p className="font-bold text-slate-900 text-sm sm:text-base">
              Not built yet
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              A dedicated review screen for "{noRouteNotice.title}" ({noRouteNotice.detail}) doesn't exist yet — only Prescription and Chest X-ray reviews are wired up so far. You can still mark it as reviewed to clear it from your queue.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setNoRouteNotice(null)}
                className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setQueue((prev) => prev.filter((q) => q.id !== noRouteNotice.id));
                  setNoRouteNotice(null);
                }}
                className="flex-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
              >
                Mark as reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}