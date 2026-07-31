import { useState } from "react";
import api from "../services/api";
import { InlineLoader } from "../components/Loader";
import { useNavigate } from "react-router-dom";
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
  ZoomIn,
  Move,
  SlidersHorizontal,
  Columns2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/doctor-dashboard" },
  { icon: Clock, label: "Schedule" },
  { icon: Users, label: "Patients", route: "/patient-clinical-workspace" },
  { icon: Stethoscope, label: "Consultations" },
  { icon: ShieldCheck, label: "Clinical AI", active: true, route: "/clinical-ai-review" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const findings = [
  {
    id: "opacity",
    title: "Right lower opacity",
    confidence: 0.78,
    status: "Suspicious",
    statusBg: "bg-red-50",
    statusText: "text-red-700",
  },
  {
    id: "effusion",
    title: "Pleural effusion",
    confidence: 0.21,
    status: "Low",
    statusBg: "bg-emerald-50",
    statusText: "text-emerald-700",
  },
  {
    id: "cardio",
    title: "Cardiomegaly",
    confidence: 0.14,
    status: "Low",
    statusBg: "bg-emerald-50",
    statusText: "text-emerald-700",
  },
];

const windowModes = ["Normal", "High contrast", "Inverted"];

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

export default function XrayAnalysisViewer() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [heatmapOn, setHeatmapOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panActive, setPanActive] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowModeIdx, setWindowModeIdx] = useState(0);
  const [compareOn, setCompareOn] = useState(false);

  const [impression, setImpression] = useState(
    "Possible right lower-zone opacity. Correlate with symptoms and radiologist report."
  );
  const [actionModal, setActionModal] = useState(null); // "confirm" | "modify" | "reject" | null
  const [rejectReason, setRejectReason] = useState("");
  const [xrayFile, setXrayFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  const runXrayAnalysis = async () => {
    if (!xrayFile) {
      setAnalysisError("Please choose an X-ray image file first.");
      return;
    }
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const formData = new FormData();
      formData.append("file", xrayFile);
      const { data } = await api.post("/api/ai/xray-analysis", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAiAnalysis(data.analysis);
      setImpression(data.analysis);
    } catch (err) {
      setAnalysisError(err?.response?.data?.detail || "AI analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const cycleZoom = () => {
    setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1));
    setPan({ x: 0, y: 0 });
  };

  const cycleWindow = () => {
    setWindowModeIdx((i) => (i + 1) % windowModes.length);
  };

  const filterForWindow = () => {
    if (windowModes[windowModeIdx] === "High contrast") return "contrast(1.6) brightness(0.9)";
    if (windowModes[windowModeIdx] === "Inverted") return "invert(1)";
    return "none";
  };

  const handleMouseDown = (e) => {
    if (!panActive || zoomLevel === 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const viewerTools = [
    { key: "zoom", label: `Zoom ${zoomLevel === 1 ? "" : Math.round(zoomLevel * 100) + "%"}`.trim(), icon: ZoomIn, active: zoomLevel !== 1, onClick: cycleZoom },
    { key: "pan", label: "Pan", icon: Move, active: panActive, onClick: () => setPanActive((p) => !p) },
    { key: "window", label: windowModes[windowModeIdx], icon: SlidersHorizontal, active: windowModeIdx !== 0, onClick: cycleWindow },
    { key: "compare", label: "Compare", icon: Columns2, active: compareOn, onClick: () => setCompareOn((c) => !c) },
  ];

  const openModal = (type) => {
    setActionModal(type);
    setRejectReason("");
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none";

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
              Chest X-ray Analysis
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

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 sm:gap-6 items-start">
            {/* IMAGE VIEWER */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Image viewer
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Study: PA chest • 12 Jul 2026 • Model output is decision
                support only
              </p>

              <div
                className={`mt-4 grid ${
                  compareOn ? "grid-cols-1 sm:grid-cols-2 gap-3" : "grid-cols-1"
                }`}
              >
                {/* Primary image */}
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`relative rounded-xl overflow-hidden bg-[#0b1220] aspect-square sm:aspect-[4/3] ${
                    panActive && zoomLevel > 1
                      ? dragging
                        ? "cursor-grabbing"
                        : "cursor-grab"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => setHeatmapOn((h) => !h)}
                    className={`absolute left-3 sm:left-5 top-3 sm:top-5 z-10 rounded-full text-xs sm:text-sm font-bold px-3.5 py-1.5 transition ${
                      heatmapOn
                        ? "bg-white/95 text-red-600"
                        : "bg-white/70 text-slate-500"
                    }`}
                  >
                    Heatmap overlay {heatmapOn ? "ON" : "OFF"}
                  </button>

                  <div
                    className="absolute inset-0 flex items-center justify-center transition-transform"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                      filter: filterForWindow(),
                    }}
                  >
                    <svg
                      viewBox="0 0 400 420"
                      className="h-[85%] w-auto"
                      fill="none"
                    >
                      {/* Simplified illustrative lung shapes — not a real medical image */}
                      <ellipse cx="140" cy="230" rx="95" ry="150" stroke="#94A3B8" strokeWidth="2" fill="#334155" />
                      <ellipse cx="270" cy="230" rx="85" ry="150" stroke="#94A3B8" strokeWidth="2" fill="#334155" />
                      <rect x="185" y="90" width="30" height="270" fill="#94A3B8" opacity="0.5" />
                      {[0, 1, 2, 3, 4].map((i) => (
                        <path
                          key={i}
                          d={`M 60 ${140 + i * 55} Q 140 ${150 + i * 55} 210 ${145 + i * 55}`}
                          stroke="#64748B"
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      ))}
                      <path d="M320 170 Q 350 230 320 300" stroke="#64748B" strokeWidth="1.5" opacity="0.6" />

                      {heatmapOn && (
                        <circle
                          cx="270"
                          cy="235"
                          r="42"
                          fill="#B91C1C"
                          fillOpacity="0.75"
                          stroke="#F87171"
                          strokeWidth="2.5"
                        />
                      )}
                    </svg>
                  </div>
                </div>

                {/* Compare panel */}
                {compareOn && (
                  <div className="relative rounded-xl overflow-hidden bg-[#0b1220] aspect-square sm:aspect-[4/3] flex items-center justify-center px-6 text-center">
                    <p className="text-slate-400 text-sm">
                      No prior study available for comparison.
                    </p>
                  </div>
                )}
              </div>

              {/* TOOLBAR */}
              <div className="mt-4 flex flex-wrap gap-2.5 sm:gap-3">
                {viewerTools.map(({ key, label, icon: Icon, active, onClick }) => (
                  <button
                    key={key}
                    onClick={onClick}
                    className={`flex items-center gap-1.5 rounded-lg border px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
                      active
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {panActive && zoomLevel === 1 && (
                <p className="mt-2 text-xs text-slate-400">
                  Zoom in first to enable panning.
                </p>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5 sm:space-y-6">
              {/* MODEL FINDINGS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Model findings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Requires clinician confirmation
                </p>

                <div className="mt-4 divide-y divide-slate-100">
                  {findings.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">
                          {f.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Confidence {f.confidence.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full ${f.statusBg} ${f.statusText} text-xs font-bold px-2.5 py-1`}
                      >
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DOCTOR REVIEW */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Doctor review
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Document the final interpretation
                </p>

                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Upload X-ray for real AI analysis (Groq vision)
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setXrayFile(e.target.files?.[0] || null)}
                    className="flex-1 text-xs sm:text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold"
                  />
                  <button
                    onClick={runXrayAnalysis}
                    disabled={analyzing}
                    className="shrink-0 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-sm transition disabled:opacity-60"
                  >
                    {analyzing ? <span className="inline-flex items-center gap-1.5"><InlineLoader /> Analyzing...</span> : "Run AI analysis"}
                  </button>
                </div>
                {analysisError && (
                  <p className="text-xs text-red-600 mb-3">{analysisError}</p>
                )}

                <h3 className="font-bold text-slate-900 text-sm mt-4 mb-2">
                  Clinical impression
                </h3>
                <textarea
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  rows={4}
                  className={fieldClass}
                />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => openModal("confirm")}
                    className="sm:col-span-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                  >
                    Confirm AI finding
                  </button>
                  <button
                    onClick={() => openModal("modify")}
                    className="rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 sm:py-3 text-sm hover:bg-slate-50 transition"
                  >
                    Modify finding
                  </button>
                  <button
                    onClick={() => openModal("reject")}
                    className="rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 sm:py-3 text-sm hover:bg-slate-50 transition"
                  >
                    Reject finding
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ACTION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActionModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            {actionModal === "confirm" && (
              <>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  Finding confirmed
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  The AI finding and your clinical impression have been added
                  to the patient record.
                </p>
                <button
                  onClick={() => setActionModal(null)}
                  className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
                >
                  Close
                </button>
              </>
            )}

            {actionModal === "modify" && (
              <>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  Modify finding
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Update the clinical impression text above to reflect your
                  interpretation, then confirm to save it as the final
                  finding.
                </p>
                <button
                  onClick={() => setActionModal(null)}
                  className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
                >
                  Got it
                </button>
              </>
            )}

            {actionModal === "reject" && (
              <>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  Reject finding
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  Briefly note why this AI finding is being rejected.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Artifact, not a true opacity"
                  className={`${fieldClass} mt-3`}
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setActionModal(null)}
                    disabled={!rejectReason.trim()}
                    className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition"
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}