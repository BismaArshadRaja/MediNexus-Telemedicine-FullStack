import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowUp,
  ShieldCheck,
  ScanText,
  ClipboardList,
  Database,
  Check,
  File as FileIcon,
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

const pipelineSteps = [
  {
    title: "Security scan",
    sub: "File type, malware and size validation",
    icon: ShieldCheck,
  },
  {
    title: "OCR & extraction",
    sub: "Text and table structure extracted",
    icon: ScanText,
  },
  {
    title: "Clinical summary",
    sub: "Key findings and abnormal values identified",
    icon: ClipboardList,
  },
  {
    title: "RAG indexing",
    sub: "Evidence chunks stored for chat",
    icon: Database,
  },
];

const MAX_SIZE_MB = 25;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

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

export default function ReportUpload() {
  const navigate = useNavigate();
  const [uploadedReportId, setUploadedReportId] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");

  const [reportType, setReportType] = useState("Laboratory report");
  const [reportDate, setReportDate] = useState("2026-07-08");
  const [provider, setProvider] = useState("City Diagnostic Lab");
  const [notes, setNotes] = useState("Fasting glucose and CBC");

  const [consentDoctor, setConsentDoctor] = useState(true);
  const [consentAI, setConsentAI] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [resultModal, setResultModal] = useState(null); // "ai" | "plain" | null

  const fileInputRef = useRef(null);

  const validateAndSetFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setFileError("Only PDF, JPG or PNG files are supported.");
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setFileError(`Each file must be under ${MAX_SIZE_MB} MB.`);
        return;
      }
    }
    setFileError("");
    setSelectedFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFiles(e.dataTransfer.files);
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e) => {
    validateAndSetFiles(e.target.files);
  };

  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const runPipeline = async () => {
    if (selectedFiles.length === 0) {
      setFileError("Please choose a file to upload first.");
      return;
    }
    setProcessing(true);
    setCurrentStep(0);
    setUploadError("");

    // Animate through the visual pipeline steps while the real upload happens
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, pipelineSteps.length - 1);
      setCurrentStep(step);
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", selectedFiles[0]);
      const { data: report } = await api.post("/api/reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await api.post(`/api/reports/${report.id}/summarize`);

      setUploadedReportId(report.id);
      sessionStorage.setItem("medinexus_last_report_id", String(report.id));
      setResultModal("ai");
    } catch (err) {
      setUploadError(err?.response?.data?.detail || "Upload or AI processing failed. Please try again.");
      setResultModal(null);
    } finally {
      clearInterval(interval);
      setProcessing(false);
      setCurrentStep(-1);
    }
  };

  const saveWithoutAI = async () => {
    if (selectedFiles.length === 0) {
      setFileError("Please choose a file to upload first.");
      return;
    }
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFiles[0]);
      const { data: report } = await api.post("/api/reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedReportId(report.id);
      sessionStorage.setItem("medinexus_last_report_id", String(report.id));
      setResultModal("plain");
    } catch (err) {
      setUploadError(err?.response?.data?.detail || "Upload failed. Please try again.");
    }
  };

  const closeModalAndReset = () => {
    setResultModal(null);
    setSelectedFiles([]);
    setCurrentStep(-1);
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

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
              Upload Medical Report
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
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 sm:gap-6 items-start">
            {/* LEFT: UPLOAD FILES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Upload files
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                PDF, JPG or PNG • max {MAX_SIZE_MB} MB per file
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`mt-4 rounded-2xl border-2 border-dashed ${
                  dragActive
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-300 bg-slate-50"
                } px-4 py-10 sm:py-14 flex flex-col items-center text-center transition`}
              >
                <div className="h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center">
                  <ArrowUp className="h-6 w-6 text-teal-700" />
                </div>
                <p className="mt-4 font-bold text-slate-900 text-base sm:text-lg">
                  Drag and drop your medical report
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  or choose files from your device
                </p>
                <button
                  onClick={handleBrowseClick}
                  className="mt-5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-2.5 sm:py-3 text-sm transition"
                >
                  Browse files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {fileError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {fileError}
                </p>
              )}

              {selectedFiles.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {selectedFiles.map((f) => (
                    <li
                      key={f.name}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileIcon className="h-4 w-4 shrink-0 text-teal-700" />
                        <span className="text-sm text-slate-800 truncate">
                          {f.name}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(f.name)}
                        className="shrink-0 text-slate-400 hover:text-red-600 transition"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* DOCUMENT DETAILS */}
              <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-8">
                Document details
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Report type
                  </label>
                  <input
                    type="text"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Report date
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5 sm:space-y-6">
              {/* PROCESSING PIPELINE */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Processing pipeline
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  What happens after upload
                </p>

                <div className="mt-5 space-y-5">
                  {pipelineSteps.map((step, idx) => {
                    const isDone = processing && idx < currentStep;
                    const isActive = processing && idx === currentStep;
                    return (
                      <div key={step.title} className="flex items-start gap-3 sm:gap-4">
                        <span
                          className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold transition ${
                            isDone
                              ? "bg-emerald-600"
                              : isActive
                              ? "bg-teal-700 animate-pulse"
                              : "bg-teal-700"
                          }`}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">
                            {step.title}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {step.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CONSENT AND PRIVACY */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Consent and privacy
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  You control who can access this record.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentDoctor}
                      onChange={(e) => setConsentDoctor(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    Allow assigned doctors to view this document during
                    consultation.
                  </label>
                  <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAI}
                      onChange={(e) => setConsentAI(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    Allow AI processing for summarization and report chat.
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="space-y-3">
                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}
                <button
                  onClick={runPipeline}
                  disabled={processing}
                  className="w-full rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-teal-700/60 disabled:cursor-not-allowed text-white font-bold py-3 text-sm sm:text-base transition"
                >
                  {processing ? "Processing..." : "Upload and process report"}
                </button>
                <button
                  onClick={saveWithoutAI}
                  disabled={processing}
                  className="w-full rounded-lg border-2 border-slate-300 text-slate-700 font-bold py-3 text-sm sm:text-base hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Save without AI processing
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* RESULT MODAL */}
      {resultModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeModalAndReset} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 text-center shadow-xl">
            <div className="mx-auto h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 font-bold text-slate-900 text-sm sm:text-base">
              {resultModal === "ai"
                ? "Report processed successfully"
                : "Report saved"}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {resultModal === "ai"
                ? `${reportType} has been analyzed and added to your health record. A clinical summary is now available.`
                : `${reportType} has been saved to your health record without AI processing.`}
            </p>
            <button
              onClick={closeModalAndReset}
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Done
            </button>
            {resultModal === "ai" && uploadedReportId && (
              <button
                onClick={() => navigate("/report-summary")}
                className="mt-2 w-full rounded-lg border border-teal-700 text-teal-700 font-semibold py-2.5 text-sm hover:bg-teal-50 transition"
              >
                View AI summary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}