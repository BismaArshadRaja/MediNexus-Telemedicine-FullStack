import { useState, useEffect } from "react";
import api from "../services/api";
import Loader, { InlineLoader } from "../components/Loader";
import { useNavigate } from "react-router-dom";
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
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: CalendarDays, label: "Appointments", route: "/find-doctor" },
  { icon: FileText, label: "Health Records", route: "/health-records" },
  { icon: Bot, label: "AI Assistant", active: true, route: "/symptom-checker" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const clinicalSummary = [
  ["Main symptoms", "Fever, sore throat, body aches"],
  ["Started", "2 days ago"],
  ["Severity", "Moderate; able to drink fluids"],
  ["Relevant negatives", "No rash, no breathing difficulty"],
  ["Possible categories", "Viral upper respiratory infection; pharyngitis"],
  ["Uncertainty", "No physical exam or laboratory testing"],
];

const recommendedActions = [
  {
    title: "Book a consultation",
    sub: "A clinician should review symptoms within 24 hours.",
  },
  {
    title: "Monitor warning signs",
    sub: "Seek urgent care for breathing difficulty, confusion or dehydration.",
  },
  {
    title: "Prepare information",
    sub: "Have current medicines, allergies and temperature readings ready.",
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

const urgencyStyles = {
  emergency: { text: "text-red-700", label: "Go to the ER now" },
  high: { text: "text-red-600", label: "See a doctor within 24 hours" },
  moderate: { text: "text-orange-600", label: "See a doctor within 24 hours" },
  low: { text: "text-emerald-700", label: "Self-care is likely fine" },
};

export default function TriageSummary() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [triage, setTriage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const symptomsSummary =
      sessionStorage.getItem("medinexus_symptom_summary") ||
      "Patient did not go through the symptom checker chat before viewing this page.";

    api
      .post("/api/ai/triage-summary", { message: symptomsSummary })
      .then(({ data }) => setTriage(data))
      .catch((err) =>
        setError(err?.response?.data?.detail || "Couldn't generate a triage summary right now.")
      )
      .finally(() => setLoading(false));
  }, []);

  const urgencyStyle = urgencyStyles[triage?.urgency_level] || urgencyStyles.moderate;

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
              Triage Summary
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

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* URGENCY ASSESSMENT */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Urgency assessment
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Generated from your answers; confirm all details before
              continuing
            </p>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-x-8 gap-y-2">
              {loading ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <InlineLoader /> Analyzing your symptoms...
                </p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <>
                  <p className={`text-sm sm:text-base font-bold ${urgencyStyle.text}`}>
                    {urgencyStyle.label}
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    Urgency: <span className="font-bold capitalize">{triage.urgency_level}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* CLINICAL SUMMARY + RECOMMENDED ACTIONS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Clinical summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Structured information for the doctor
              </p>
              <dl className="mt-4 sm:mt-5 divide-y divide-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm font-semibold text-slate-500 sm:w-40 shrink-0">
                    Symptoms
                  </dt>
                  <dd className="text-sm text-slate-800 whitespace-pre-line">
                    {triage?.symptoms_summary || "No conversation recorded yet."}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm font-semibold text-slate-500 sm:w-40 shrink-0">
                    AI recommendation
                  </dt>
                  <dd className="text-sm text-slate-800">
                    {triage?.recommendation || "-"}
                  </dd>
                </div>
                {clinicalSummary.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <dt className="text-sm font-semibold text-slate-500 sm:w-40 shrink-0">
                      {label}
                    </dt>
                    <dd className="text-sm text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Recommended actions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Designed to support safe next steps
              </p>
              <div className="mt-4 sm:mt-5 space-y-5">
                {recommendedActions.map((action, idx) => (
                  <div key={action.title} className="flex items-start gap-3 sm:gap-4">
                    <span className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        {action.title}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {action.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CONTINUE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Continue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Choose how you want to proceed
            </p>

            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-3">
              <button className="w-full sm:w-auto sm:flex-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-3 text-sm transition">
                Book recommended doctor
              </button>
              <button className="w-full sm:w-auto sm:flex-1 rounded-lg border-2 border-blue-600 text-blue-700 font-semibold px-5 py-3 text-sm hover:bg-blue-50 transition">
                Save to health record
              </button>
              <button className="w-full sm:w-auto sm:flex-1 rounded-lg border border-slate-300 text-slate-700 font-semibold px-5 py-3 text-sm hover:bg-slate-50 transition">
                Edit symptom answers
              </button>
            </div>

            <div className="mt-4 sm:mt-5 flex items-start gap-2 text-xs sm:text-sm font-medium text-red-600 leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Emergency symptoms can change quickly. Call local emergency
                services if severe breathing difficulty, chest pain,
                fainting, stroke signs, or heavy bleeding develops.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}