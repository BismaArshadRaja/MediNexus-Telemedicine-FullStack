import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bot,
  MessageSquare,
  Bell,
  Settings,
  Stethoscope,
  CalendarPlus,
  UploadCloud,
  MessageCircleQuestion,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, route: "/dashboard" },
  { icon: CalendarDays, label: "Appointments", route: "/find-doctor" },
  { icon: FileText, label: "Health Records", route: "/health-records" },
  { icon: Bot, label: "AI Assistant", route: "/symptom-checker" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const staticStatMeta = [
  { label: "Next appointment", valueClass: "text-xl sm:text-2xl lg:text-3xl", subClass: "text-blue-700", dot: "bg-blue-600" },
  { label: "Health records", subClass: "text-emerald-700", dot: "bg-teal-700" },
  { label: "Reports pending review", subClass: "text-orange-600", dot: "bg-orange-500" },
  { label: "Risk alerts", subClass: "text-emerald-700", dot: "bg-emerald-500" },
];

const quickActions = [
  {
    title: "Check symptoms",
    sub: "Guided triage with red-flag screening",
    icon: Stethoscope,
    iconBg: "bg-red-500",
    cardBg: "bg-red-50",
    route: "/symptom-checker",
  },
  {
    title: "Book appointment",
    sub: "Find a doctor and choose a time",
    icon: CalendarPlus,
    iconBg: "bg-blue-600",
    cardBg: "bg-blue-50",
  },
  {
    title: "Upload report",
    sub: "Get a simple-language summary",
    icon: UploadCloud,
    iconBg: "bg-violet-600",
    cardBg: "bg-violet-50",
  },
  {
    title: "Chat with records",
    sub: "Ask questions using your documents",
    icon: MessageCircleQuestion,
    iconBg: "bg-teal-700",
    cardBg: "bg-teal-50",
  },
];

const upcomingCare = [
  {
    time: "3:30 PM",
    title: "Video consultation",
    sub: "Dr. Sana Malik",
    status: "Confirmed",
    statusClass: "bg-emerald-50 text-emerald-700",
  },
  {
    time: "Tomorrow",
    title: "Medication reminder",
    sub: "Amoxicillin - after meal",
    status: "Due",
    statusClass: "bg-amber-50 text-amber-700",
  },
  {
    time: "18 Jul",
    title: "Follow-up blood test",
    sub: "CBC + fasting glucose",
    status: "Scheduled",
    statusClass: "bg-blue-50 text-blue-700",
  },
];

const timeline = [
  {
    date: "12 Jul",
    title: "Chest X-ray analyzed",
    sub: "AI finding available for doctor review",
    dot: "bg-violet-600",
  },
  {
    date: "10 Jul",
    title: "Prescription updated",
    sub: "One interaction warning resolved by doctor",
    dot: "bg-orange-500",
  },
  {
    date: "08 Jul",
    title: "Lab report summarized",
    sub: "Glucose highlighted as above reference range",
    dot: "bg-blue-600",
  },
  {
    date: "04 Jul",
    title: "Video consultation completed",
    sub: "Care plan and follow-up saved",
    dot: "bg-teal-700",
  },
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

export default function PatientDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/api/appointments/mine"),
      api.get("/api/health-records/"),
      api.get("/api/reports/"),
    ])
      .then(([apptRes, recordsRes, reportsRes]) => {
        if (apptRes.status === "fulfilled") setAppointments(apptRes.value.data);
        if (recordsRes.status === "fulfilled") setHealthRecords(recordsRes.value.data);
        if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const initials = (user?.full_name || "PA")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const realUpcomingCare = appointments
    .filter((a) => new Date(a.scheduled_time) >= new Date())
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 3)
    .map((a) => ({
      time: new Date(a.scheduled_time).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: "Video consultation",
      sub: a.doctor_name || `Doctor #${a.doctor_id}`,
      status: a.status === "scheduled" ? "Confirmed" : a.status,
      statusClass: "bg-emerald-50 text-emerald-700",
    }));

  const displayedUpcomingCare = realUpcomingCare.length > 0 ? realUpcomingCare : upcomingCare;

  const nextAppt = appointments
    .filter((a) => new Date(a.scheduled_time) >= new Date())
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))[0];
  const reportsPending = reports.filter((r) => !r.summary).length;

  const statValues = [
    nextAppt
      ? {
          value: new Date(nextAppt.scheduled_time).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sub: nextAppt.doctor_name || `Doctor #${nextAppt.doctor_id}`,
        }
      : { value: "None scheduled", sub: "Book an appointment below" },
    { value: String(healthRecords.length + reports.length), sub: `${reports.length} report(s) uploaded` },
    { value: String(reportsPending), sub: reportsPending > 0 ? "Awaiting AI summary" : "All caught up" },
    { value: "0", sub: "No urgent alerts" },
  ];

  const statCards = staticStatMeta.map((meta, idx) => ({ ...meta, ...statValues[idx] }));

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
              Good morning, {firstName}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
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
          {/* Compact avatar-only on very small screens */}
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* STAT CARDS */}
          {statsLoading ? (
            <Loader label="Loading your dashboard..." />
          ) : (
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
                  <span
                    className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full ${card.dot}`}
                  />
                </div>
                <p
                  className={`mt-2 sm:mt-3 font-extrabold text-slate-900 ${
                    card.valueClass || "text-2xl sm:text-3xl"
                  }`}
                >
                  {card.value}
                </p>
                <p
                  className={`mt-1 text-xs sm:text-sm font-semibold ${card.subClass}`}
                >
                  {card.sub}
                </p>
              </div>
            ))}
          </div>
          )}

          {/* QUICK ACTIONS + UPCOMING CARE */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Quick actions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Start common health tasks
              </p>
              <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map(({ title, sub, icon: Icon, iconBg, cardBg, route }) => (
                  <button
                    key={title}
                    onClick={() => route && navigate(route)}
                    disabled={!route}
                    className={`flex items-start gap-3 rounded-xl ${cardBg} p-3.5 sm:p-4 text-left transition ${
                      route ? "hover:brightness-95 cursor-pointer" : "cursor-default opacity-90"
                    }`}
                  >
                    <span
                      className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full ${iconBg} flex items-center justify-center text-white`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        {title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Upcoming care
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Appointments and reminders
              </p>
              <div className="mt-4 sm:mt-5 divide-y divide-slate-100">
                {displayedUpcomingCare.map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3.5 sm:py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <span className="w-14 sm:w-16 shrink-0 text-xs font-semibold text-teal-700">
                        {item.time}
                      </span>
                      <span className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.sub}
                        </p>
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.statusClass}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HEALTH TIMELINE + SAFETY NOTICE */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Health timeline
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Latest clinical activity
              </p>
              <ol className="mt-5 sm:mt-6 relative border-l border-slate-200 ml-2 space-y-6 sm:space-y-7">
                {timeline.map((item) => (
                  <li key={item.title} className="ml-5 sm:ml-6">
                    <span
                      className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${item.dot}`}
                    />
                    <p className="text-xs font-semibold text-slate-500">
                      {item.date}
                    </p>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Safety notice
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                AI guidance is supportive, not a diagnosis
              </p>
              <p className="mt-3 sm:mt-4 text-sm text-slate-700 leading-relaxed">
                Your symptom and report tools show source evidence,
                uncertainty, and when to contact a clinician. Critical red
                flags trigger an emergency warning.
              </p>
              <button className="mt-5 sm:mt-6 w-full rounded-lg border-2 border-orange-500 text-orange-600 font-semibold py-2.5 text-sm hover:bg-orange-50 transition">
                View safety guidance
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}