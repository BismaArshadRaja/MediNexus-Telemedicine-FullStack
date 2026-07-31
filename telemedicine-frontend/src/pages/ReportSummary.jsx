import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { InlineLoader } from "../components/Loader";
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
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: CalendarDays, label: "Appointments", route: "/find-doctor" },
  { icon: FileText, label: "Health Records", active: true, route: "/health-records" },
  { icon: Bot, label: "AI Assistant", route: "/symptom-checker" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const keyFindings = [
  {
    label: "Fasting glucose",
    value: "132 mg/dL",
    valueColor: "text-red-600",
    reference: "Reference: 70-99 mg/dL",
    status: "High",
    statusBg: "bg-red-50",
    statusText: "text-red-700",
  },
  {
    label: "Hemoglobin",
    value: "13.8 g/dL",
    valueColor: "text-emerald-700",
    reference: "Reference: 12.0-15.5 g/dL",
    status: "Normal",
    statusBg: "bg-emerald-50",
    statusText: "text-emerald-700",
  },
  {
    label: "WBC",
    value: "7.2 ×10⁹/L",
    valueColor: "text-emerald-700",
    reference: "Reference: 4.0-11.0 ×10⁹/L",
    status: "Normal",
    statusBg: "bg-emerald-50",
    statusText: "text-emerald-700",
  },
  {
    label: "Platelets",
    value: "268 ×10⁹/L",
    valueColor: "text-emerald-700",
    reference: "Reference: 150-450 ×10⁹/L",
    status: "Normal",
    statusBg: "bg-emerald-50",
    statusText: "text-emerald-700",
  },
];

const sourceEvidence = [
  { page: "Page 1", claim: "Fasting glucose: 132 mg/dL [H]" },
  { page: "Page 2", claim: "Hemoglobin: 13.8 g/dL" },
  { page: "Page 2", claim: "WBC: 7.2 ×10⁹/L" },
  { page: "Page 3", claim: "Platelets: 268 ×10⁹/L" },
];

const nextSteps = [
  "Discuss elevated fasting glucose with a doctor.",
  "Do not change medicines based only on this summary.",
  "Repeat testing may be recommended by a clinician.",
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

export default function ReportSummary() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const reportId = sessionStorage.getItem("medinexus_last_report_id");
    if (!reportId) {
      setLoadError("No recently uploaded report found. Please upload a report first.");
      setLoading(false);
      return;
    }
    api
      .get("/api/reports/")
      .then(({ data }) => {
        const found = data.find((r) => String(r.id) === reportId);
        if (!found) {
          setLoadError("Couldn't find that report.");
        } else {
          setReport(found);
        }
      })
      .catch(() => setLoadError("Couldn't load the report summary."))
      .finally(() => setLoading(false));
  }, []);

  const summaryLines = (report?.summary || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bulletLines = summaryLines.filter((l) => /^[-•\d]/.test(l));
  const paragraphLines = summaryLines.filter((l) => !/^[-•\d]/.test(l));
  const navigate = useNavigate();

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
              Report Summary
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
          {/* REPORT HEADER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {loading ? "Loading..." : report?.filename || "Report"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {report ? `Uploaded ${new Date(report.created_at).toLocaleDateString()}` : ""}
              </p>
            </div>
            <span className="shrink-0 w-fit rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-bold px-3.5 py-1.5">
              Doctor review recommended
            </span>
          </div>

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {!loadError && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* SIMPLE-LANGUAGE SUMMARY */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Simple-language summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                AI-generated from the uploaded document
              </p>

              <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {loading ? (
                  <span className="inline-flex items-center gap-2"><InlineLoader /> Loading summary...</span>
                ) : (
                  paragraphLines.join(" ") || "No summary text available."
                )}
              </p>

              {bulletLines.length > 0 && (
                <>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-6 mb-3">
                    Key findings
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {bulletLines.map((line, idx) => (
                      <div key={idx} className="py-3 first:pt-0 text-sm text-slate-800">
                        {line.replace(/^[-•\d.]+\s*/, "")}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5 sm:space-y-6">
              {/* SOURCE EVIDENCE */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Source evidence
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Every claim links back to the document
                </p>

                <div className="mt-4 space-y-3.5">
                  {sourceEvidence.map((e, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"
                    >
                      <span className="text-sm font-bold text-blue-700 sm:w-16 shrink-0">
                        {e.page}
                      </span>
                      <span className="text-sm text-slate-700">
                        {e.claim}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setNotice(
                      "Opening the original report viewer isn't wired up yet — this will jump to the highlighted source once the document viewer is built."
                    )
                  }
                  className="mt-5 w-full rounded-lg border-2 border-blue-600 text-blue-700 font-semibold py-2.5 sm:py-3 text-sm hover:bg-blue-50 transition"
                >
                  Open original report at highlighted source
                </button>
              </div>

              {/* NEXT STEPS */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Next steps
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Safe, non-diagnostic guidance
                </p>

                <ul className="mt-4 space-y-2.5">
                  {nextSteps.map((step) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 text-sm text-slate-800"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                      {step}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() =>
                      setNotice(
                        "Report chat isn't connected yet — this will open a conversation grounded in this document once that feature is built."
                      )
                    }
                    className="w-full sm:flex-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 sm:py-3 text-sm transition"
                  >
                    Ask about this report
                  </button>
                  <button
                    onClick={() => navigate("/find-doctor")}
                    className="w-full sm:flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 sm:py-3 text-sm transition"
                  >
                    Book doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      {/* NOTICE MODAL */}
      {notice && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNotice(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 text-center shadow-xl">
            <p className="font-bold text-slate-900 text-sm sm:text-base">
              Not connected yet
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {notice}
            </p>
            <button
              onClick={() => setNotice(null)}
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}