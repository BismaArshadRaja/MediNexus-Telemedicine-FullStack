import { useMemo, useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Bot,
  ScrollText,
  Activity,
  Settings,
  Menu,
  X,
  Plus,
  Trash2,
  Download,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, route: "/admin-dashboard" },
  { icon: Users, label: "Users" },
  { icon: ShieldAlert, label: "Clinical Safety" },
  { icon: Bot, label: "Agent Runs" },
  { icon: ScrollText, label: "Audit Logs" },
  { icon: Activity, label: "System Health" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const statusCycle = ["Open", "Reviewed", "Resolved"];
const statusStyles = {
  Open: "bg-amber-50 text-amber-700",
  Reviewed: "bg-emerald-50 text-emerald-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

const initialSafetyEvents = [
  {
    id: 1,
    type: "Triage red flag",
    patientId: "P-88012",
    detail: "Emergency instruction shown",
    status: "Reviewed",
  },
  {
    id: 2,
    type: "Prescription alert",
    patientId: "P-10482",
    detail: "QT risk warning",
    status: "Open",
  },
  {
    id: 3,
    type: "Model confidence",
    patientId: "P-54301",
    detail: "Imaging confidence < threshold",
    status: "Open",
  },
  {
    id: 4,
    type: "Consent revoked",
    patientId: "P-23014",
    detail: "RAG access removed",
    status: "Resolved",
  },
];

const systemHealth = [
  { label: "API availability", value: "99.99%", status: "Healthy" },
  { label: "P95 API latency", value: "284 ms", status: "Healthy" },
  { label: "OCR queue", value: "18 jobs", status: "Normal" },
  { label: "Agent failure rate", value: "0.7%", status: "Watch" },
  { label: "Vector retrieval", value: "112 ms", status: "Healthy" },
];

const healthStyles = {
  Healthy: "bg-emerald-50 text-emerald-700",
  Normal: "bg-emerald-50 text-emerald-700",
  Watch: "bg-amber-50 text-amber-700",
};

const qualityMetrics = [
  { label: "Citation coverage", display: "98.2%", pct: 98.2 },
  { label: "Doctor override rate", display: "31.4%", pct: 31.4 },
  { label: "Unsafe output blocked", display: "47", pct: 65 },
  { label: "Average confidence", display: "0.81", pct: 81 },
  { label: "Hallucination audit failures", display: "0.6%", pct: 6 },
];

const initialAgentRuns = [
  { id: 1, agent: "Symptom triage", patient: "P-88012", result: "Success", time: "2 min ago" },
  { id: 2, agent: "Report summarizer", patient: "P-10482", result: "Success", time: "6 min ago" },
  { id: 3, agent: "Imaging classifier", patient: "P-54301", result: "Low confidence", time: "11 min ago" },
  { id: 4, agent: "Prescription safety", patient: "P-10482", result: "Success", time: "18 min ago" },
  { id: 5, agent: "RAG report chat", patient: "P-23014", result: "Failed", time: "24 min ago" },
];

const initialReviewers = [
  { id: 1, name: "Dr. Sana Malik", role: "Clinical safety lead" },
  { id: 2, name: "Dr. Hamza Ali", role: "Reviewer" },
  { id: 3, name: "Dr. Areeba Khan", role: "Reviewer" },
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

export default function AdminDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [safetyEvents, setSafetyEvents] = useState(initialSafetyEvents);
  const [agentRuns, setAgentRuns] = useState(initialAgentRuns);
  const [reviewers, setReviewers] = useState(initialReviewers);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [realStats, setRealStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then(({ data }) => setRealStats(data))
      .catch(() => setStatsError("Couldn't load live platform stats (showing demo data below instead)."));
  }, []);

  const [agentRunsOpen, setAgentRunsOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [reviewersOpen, setReviewersOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const openCount = safetyEvents.filter((e) => e.status === "Open").length;
  const reviewedOrResolvedCount = safetyEvents.length - openCount;
  const failedRunsCount = agentRuns.filter((r) => r.result === "Failed").length;
  const failedRunsPct = agentRuns.length
    ? ((failedRunsCount / agentRuns.length) * 100).toFixed(1)
    : "0.0";

  const statCards = useMemo(
    () => [
      {
        label: "Total patients",
        value: realStats ? String(realStats.total_patients) : "...",
        sub: realStats ? `${realStats.total_doctors} doctors on platform` : "Loading...",
        subClass: "text-blue-700",
        dot: "bg-blue-600",
      },
      {
        label: "Total appointments",
        value: realStats ? String(realStats.total_appointments) : "...",
        sub: realStats ? `${realStats.total_reports} reports uploaded` : "Loading...",
        subClass: "text-teal-700",
        dot: "bg-teal-700",
      },
      {
        label: "AI agent runs",
        value: String(agentRuns.length),
        sub: `${failedRunsPct}% failed`,
        subClass: "text-violet-700",
        dot: "bg-violet-600",
      },
      {
        label: "Critical safety events",
        value: String(safetyEvents.length),
        sub:
          openCount > 0
            ? `${openCount} open, ${reviewedOrResolvedCount} reviewed`
            : "All reviewed",
        subClass: "text-red-700",
        dot: "bg-red-600",
      },
    ],
    [agentRuns, failedRunsPct, safetyEvents.length, openCount, reviewedOrResolvedCount, realStats]
  );

  const [policyDraft, setPolicyDraft] = useState({
    version: "triage-v3",
    confidenceThreshold: "0.70",
    requireHumanApproval: true,
  });

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  };

  const cycleStatus = (id) => {
    setSafetyEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextIdx = (statusCycle.indexOf(e.status) + 1) % statusCycle.length;
        return { ...e, status: statusCycle[nextIdx] };
      })
    );
  };

  const exportAuditReport = () => {
    const lines = [
      "MediNexus Audit Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Clinical safety events:",
      ...safetyEvents.map(
        (e) => `- [${e.status}] ${e.type} (${e.patientId}): ${e.detail}`
      ),
      "",
      "System health:",
      ...systemHealth.map((s) => `- ${s.label}: ${s.value} (${s.status})`),
      "",
      "AI quality metrics:",
      ...qualityMetrics.map((q) => `- ${q.label}: ${q.display}`),
      "",
      "Recent agent runs:",
      ...agentRuns.map(
        (r) => `- [${r.result}] ${r.agent} (${r.patient}) - ${r.time}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medinexus-audit-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Audit report downloaded.");
  };

  const savePolicy = () => {
    setPolicyOpen(false);
    showToast(`Safety policy updated to ${policyDraft.version}.`);
  };

  const addReviewer = () => {
    const name = newReviewerName.trim();
    if (!name) return;
    setReviewers((prev) => [
      ...prev,
      { id: Date.now(), name, role: "Reviewer" },
    ]);
    setNewReviewerName("");
  };

  const removeReviewer = (id) => {
    setReviewers((prev) => prev.filter((r) => r.id !== id));
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

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
              Platform Administration
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Admin Account
              </p>
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                Verified
              </p>
            </div>
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            AD
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

          {/* CLINICAL SAFETY + SYSTEM HEALTH */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Clinical safety monitoring
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                High-priority events requiring governance review
                {openCount > 0 ? ` • ${openCount} open` : ""}
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {safetyEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {e.type}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {e.patientId} • {e.detail}
                      </p>
                    </div>
                    <button
                      onClick={() => cycleStatus(e.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold hover:brightness-95 transition ${statusStyles[e.status]}`}
                    >
                      {e.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                System health
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Last 15 minutes
              </p>

              <div className="mt-4 divide-y divide-slate-100">
                {systemHealth.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <p className="text-sm text-slate-600">{s.label}</p>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-slate-900 text-sm sm:text-base">
                        {s.value}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${healthStyles[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI QUALITY METRICS + GOVERNANCE ACTIONS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI quality metrics
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Rolling 30-day governance indicators
              </p>

              <div className="mt-5 space-y-4">
                {qualityMetrics.map((q) => (
                  <div key={q.label}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="text-sm text-slate-600">{q.label}</p>
                      <p className="font-bold text-slate-900 text-sm shrink-0">
                        {q.display}
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-700"
                        style={{ width: `${Math.min(q.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Governance actions
              </h2>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setAgentRunsOpen(true)}
                  className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                >
                  Review agent runs
                </button>
                <button
                  onClick={exportAuditReport}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                >
                  <Download className="h-4 w-4" />
                  Export audit report
                </button>
                <button
                  onClick={() => setPolicyOpen(true)}
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                >
                  Update safety policy
                </button>
                <button
                  onClick={() => setReviewersOpen(true)}
                  className="w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                >
                  Manage clinical reviewers
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* REVIEW AGENT RUNS MODAL */}
      {agentRunsOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAgentRunsOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-base">
                Recent agent runs
              </p>
              <button
                onClick={() => setAgentRunsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {agentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{run.agent}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {run.patient} • {run.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        run.result === "Success"
                          ? "bg-emerald-50 text-emerald-700"
                          : run.result === "Failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {run.result}
                    </span>
                    {run.result === "Failed" && (
                      <button
                        onClick={() => {
                          setAgentRuns((prev) =>
                            prev.map((r) =>
                              r.id === run.id ? { ...r, result: "Success" } : r
                            )
                          );
                          showToast(`${run.agent} run retried successfully.`);
                        }}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAgentRunsOpen(false)}
              className="mt-5 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* UPDATE SAFETY POLICY MODAL */}
      {policyOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPolicyOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            <p className="font-bold text-slate-900 text-base">
              Update safety policy
            </p>

            <label className="block text-xs font-semibold text-slate-500 mt-4 mb-1">
              Policy version
            </label>
            <input
              value={policyDraft.version}
              onChange={(e) =>
                setPolicyDraft((p) => ({ ...p, version: e.target.value }))
              }
              className={fieldClass}
            />

            <label className="block text-xs font-semibold text-slate-500 mt-4 mb-1">
              Minimum model confidence threshold
            </label>
            <input
              value={policyDraft.confidenceThreshold}
              onChange={(e) =>
                setPolicyDraft((p) => ({
                  ...p,
                  confidenceThreshold: e.target.value,
                }))
              }
              className={fieldClass}
            />

            <label className="flex items-center gap-2.5 mt-4 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={policyDraft.requireHumanApproval}
                onChange={(e) =>
                  setPolicyDraft((p) => ({
                    ...p,
                    requireHumanApproval: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Require human approval for high-risk outputs
            </label>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPolicyOpen(false)}
                className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={savePolicy}
                className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 text-sm transition"
              >
                Save policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE REVIEWERS MODAL */}
      {reviewersOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewersOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-base">
                Clinical reviewers
              </p>
              <button
                onClick={() => setReviewersOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {reviewers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                      {r.name}
                    </p>
                    <p className="text-xs text-slate-500">{r.role}</p>
                  </div>
                  <button
                    onClick={() => removeReviewer(r.id)}
                    className="shrink-0 p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {reviewers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No reviewers added.
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newReviewerName}
                onChange={(e) => setNewReviewerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReviewer()}
                placeholder="Add reviewer name..."
                className={fieldClass}
              />
              <button
                onClick={addReviewer}
                className="shrink-0 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2.5 transition"
                aria-label="Add reviewer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setReviewersOpen(false)}
              className="mt-5 w-full rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}