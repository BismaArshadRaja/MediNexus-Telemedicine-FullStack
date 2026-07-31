import { useMemo, useRef, useState, useEffect } from "react";
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
  Menu,
  X,
  Upload,
  SearchX,
  ChevronDown,
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

// Fixed reference "today" so date-range filtering is deterministic in this demo
const TODAY = new Date(2026, 6, 16);

const initialRecords = [
  {
    id: 1,
    isoDate: "2026-07-12",
    displayDate: "12 Jul 2026",
    title: "Chest X-ray",
    category: "Imaging",
    provider: "Dr. Sana Malik",
    dot: "bg-violet-600",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    description: "AI analysis completed; waiting for doctor review",
    action: "Review",
    details:
      "Frontal and lateral chest views obtained. AI screening flagged no acute abnormality; findings pending radiologist confirmation.",
  },
  {
    id: 2,
    isoDate: "2026-07-10",
    displayDate: "10 Jul 2026",
    title: "Prescription updated",
    category: "Medication",
    provider: "Dr. Sana Malik",
    dot: "bg-orange-500",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    description: "Azithromycin 500 mg; interaction check passed",
    action: "Open",
    details:
      "Azithromycin 500 mg, once daily for 3 days. Automated interaction check against current medication list passed with no conflicts.",
  },
  {
    id: 3,
    isoDate: "2026-07-08",
    displayDate: "08 Jul 2026",
    title: "Laboratory report",
    category: "Lab",
    provider: "MediNexus Diagnostics Lab",
    dot: "bg-blue-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    description: "Glucose 132 mg/dL highlighted above reference",
    action: "View summary",
    details:
      "Fasting glucose 132 mg/dL (reference: 70-99 mg/dL) — above range. Other panel values within normal limits.",
  },
  {
    id: 4,
    isoDate: "2026-07-04",
    displayDate: "04 Jul 2026",
    title: "Video consultation",
    category: "Consultation",
    provider: "Dr. Sana Malik",
    dot: "bg-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    description: "Sore throat and fever; follow-up in 7 days",
    action: "Open notes",
    details:
      "Patient reported sore throat, fever and body aches for 2 days. Advised fluids and rest; prescribed Azithromycin. Follow-up scheduled in 7 days.",
  },
  {
    id: 5,
    isoDate: "2026-06-21",
    displayDate: "21 Jun 2026",
    title: "CBC report",
    category: "Lab",
    provider: "MediNexus Diagnostics Lab",
    dot: "bg-blue-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    description: "Hemoglobin and WBC within reference range",
    action: "View summary",
    details:
      "Complete blood count within normal limits. Hemoglobin 13.8 g/dL, WBC 6,800/uL, platelets 245,000/uL.",
  },
];

const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
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

export default function HealthRecords() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [records, setRecords] = useState(initialRecords);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All records");
  const [dateRange, setDateRange] = useState("all");
  const [provider, setProvider] = useState("");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const fileInputRef = useRef(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.get("/api/health-records/"), api.get("/api/reports/")])
      .then(([recordsRes, reportsRes]) => {
        const realRecords =
          recordsRes.status === "fulfilled"
            ? recordsRes.value.data.map((r) => {
                const dt = new Date(r.created_at);
                return {
                  id: `record-${r.id}`,
                  isoDate: dt.toISOString().slice(0, 10),
                  displayDate: dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                  title: r.title,
                  category: r.record_type === "lab" ? "Lab" : r.record_type === "diagnosis" ? "Diagnosis" : "Note",
                  provider: "You",
                  dot: "bg-teal-600",
                  badgeBg: "bg-teal-50",
                  badgeText: "text-teal-700",
                  description: r.content?.slice(0, 80) || "No details added",
                  action: "View",
                  details: r.content || "No further details.",
                };
              })
            : [];

        const realReports =
          reportsRes.status === "fulfilled"
            ? reportsRes.value.data.map((r) => {
                const dt = new Date(r.created_at);
                return {
                  id: `report-${r.id}`,
                  isoDate: dt.toISOString().slice(0, 10),
                  displayDate: dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                  title: r.filename,
                  category: "Lab",
                  provider: "Uploaded by you",
                  dot: "bg-blue-600",
                  badgeBg: "bg-blue-50",
                  badgeText: "text-blue-700",
                  description: r.summary ? "AI summary ready" : "Uploaded; not yet summarized",
                  action: r.summary ? "View summary" : "Summarize",
                  details: r.summary || "No AI summary generated yet.",
                };
              })
            : [];

        const combined = [...realRecords, ...realReports].sort(
          (a, b) => new Date(b.isoDate) - new Date(a.isoDate)
        );

        if (combined.length === 0) {
          setUsingDemoData(true); // keep initialRecords (demo) so the page isn't empty
        } else {
          setRecords(combined);
        }
      })
      .finally(() => setLoadingRecords(false));
  }, []);

  const providers = useMemo(
    () => [...new Set(records.map((r) => r.provider))],
    [records]
  );

  const categoryToRecordType = {
    "All records": null,
    Consultations: "Consultation",
    "Lab reports": "Lab",
    Prescriptions: "Medication",
    Imaging: "Imaging",
    Documents: "Document",
  };

  const categories = useMemo(() => {
    const counts = records.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
    return [
      { label: "All records", count: records.length },
      { label: "Consultations", count: counts["Consultation"] || 0 },
      { label: "Lab reports", count: counts["Lab"] || 0 },
      { label: "Prescriptions", count: counts["Medication"] || 0 },
      { label: "Imaging", count: counts["Imaging"] || 0 },
      { label: "Documents", count: counts["Document"] || 0 },
    ].filter((c) => c.label === "All records" || c.count > 0);
  }, [records]);

  const withinDateRange = (isoDate) => {
    if (dateRange === "all") return true;
    const recordDate = new Date(isoDate);
    const diffDays = (TODAY - recordDate) / (1000 * 60 * 60 * 24);
    if (dateRange === "7d") return diffDays <= 7;
    if (dateRange === "30d") return diffDays <= 30;
    if (dateRange === "3m") return diffDays <= 90;
    return true;
  };

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const wantedType = categoryToRecordType[activeCategory];
    return records
      .filter((r) => {
        const matchesCategory = !wantedType || r.category === wantedType;
        const matchesQuery =
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        const matchesProvider = !provider || r.provider === provider;
        const matchesDate = withinDateRange(r.isoDate);
        return matchesCategory && matchesQuery && matchesProvider && matchesDate;
      })
      .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
  }, [records, query, activeCategory, provider, dateRange]);

  const resetAllFilters = () => {
    setQuery("");
    setActiveCategory("All records");
    setDateRange("all");
    setProvider("");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const todayIso = TODAY.toISOString().slice(0, 10);
    const todayDisplay = "16 Jul 2026";

    const newRecords = files.map((file, idx) => ({
      id: Date.now() + idx,
      isoDate: todayIso,
      displayDate: todayDisplay,
      title: file.name,
      category: "Document",
      provider: "You",
      dot: "bg-slate-500",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-700",
      description: `${(file.size / 1024).toFixed(0)} KB • Uploaded just now`,
      action: "View",
      details: `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(
        1
      )} KB). This document has been added to your health record.`,
    }));

    setRecords((prev) => [...newRecords, ...prev]);
    setActiveCategory("All records");
    e.target.value = "";
  };

  const fieldClass =
    "rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

  const activeDateLabel =
    dateRangeOptions.find((d) => d.value === dateRange)?.label || "Date range";

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
              Health Records
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
          {/* SEARCH AND ORGANIZE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Search and organize
              </h2>
              {(query || activeCategory !== "All records" || dateRange !== "all" || provider) && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 shrink-0"
                >
                  Clear all
                </button>
              )}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search diagnoses, medicines, test values..."
              className={`mt-4 w-full ${fieldClass}`}
            />

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <button
                onClick={resetAllFilters}
                className={`${fieldClass} text-center font-semibold ${
                  activeCategory === "All records" &&
                  dateRange === "all" &&
                  !provider
                    ? "border-teal-600 text-teal-700"
                    : ""
                }`}
              >
                All records
              </button>

              {/* DATE RANGE DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDateMenuOpen((o) => !o);
                    setProviderMenuOpen(false);
                  }}
                  className={`${fieldClass} w-full flex items-center justify-center gap-1.5 font-semibold ${
                    dateRange !== "all" ? "border-teal-600 text-teal-700" : ""
                  }`}
                >
                  {activeDateLabel}
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </button>
                {dateMenuOpen && (
                  <div className="absolute z-20 mt-1.5 w-full min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg py-1.5">
                    {dateRangeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDateRange(opt.value);
                          setDateMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition ${
                          dateRange === opt.value
                            ? "text-teal-700 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PROVIDER DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProviderMenuOpen((o) => !o);
                    setDateMenuOpen(false);
                  }}
                  className={`${fieldClass} w-full flex items-center justify-center gap-1.5 font-semibold truncate ${
                    provider ? "border-teal-600 text-teal-700" : ""
                  }`}
                >
                  <span className="truncate">{provider || "Provider"}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </button>
                {providerMenuOpen && (
                  <div className="absolute z-20 mt-1.5 w-full min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-lg py-1.5">
                    <button
                      onClick={() => {
                        setProvider("");
                        setProviderMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition ${
                        !provider ? "text-teal-700 font-semibold" : "text-slate-700"
                      }`}
                    >
                      All providers
                    </button>
                    {providers.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setProvider(p);
                          setProviderMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition truncate ${
                          provider === p
                            ? "text-teal-700 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 sm:gap-6 items-start">
            {/* RECORD CATEGORIES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Record categories
              </h2>
              <div className="mt-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {categories.map(({ label, count }) => (
                  <button
                    key={label}
                    onClick={() => setActiveCategory(label)}
                    className={`shrink-0 lg:w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                      activeCategory === label
                        ? "bg-teal-50 text-teal-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="whitespace-nowrap">{label}</span>
                    <span
                      className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        activeCategory === label
                          ? "bg-teal-700 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENT TIMELINE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Patient timeline
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Chronological, versioned clinical history
              </p>
              {usingDemoData && !loadingRecords && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Showing example records — upload a report or add a record to see your real data here.
                </p>
              )}

              {loadingRecords ? (
                <Loader label="Loading your health records..." />
              ) : filteredRecords.length === 0 ? (
                <div className="mt-8 mb-4 flex flex-col items-center text-center">
                  <SearchX className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700 text-sm">
                    No records found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try a different search, filter, or category.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="mt-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-sm transition"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <ol className="mt-6 relative border-l border-slate-200 ml-3">
                  {filteredRecords.map((r) => (
                    <li key={r.id} className="ml-6 pb-8 last:pb-0">
                      <span
                        className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${r.dot}`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-500">
                            {r.displayDate}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <p className="font-bold text-slate-900 text-sm sm:text-base break-words">
                              {r.title}
                            </p>
                            <span
                              className={`rounded-full ${r.badgeBg} ${r.badgeText} text-xs font-bold px-2.5 py-1 shrink-0`}
                            >
                              {r.category}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                            {r.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="shrink-0 rounded-lg border-2 border-teal-700 text-teal-700 font-semibold px-5 py-2 text-sm hover:bg-teal-50 transition w-full sm:w-auto"
                        >
                          {r.action}
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* RECORD DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRecord(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedRecord.displayDate}
                </p>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">
                  {selectedRecord.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full ${selectedRecord.badgeBg} ${selectedRecord.badgeText} text-xs font-bold px-2.5 py-1`}
              >
                {selectedRecord.category}
              </span>
              <span className="text-xs text-slate-500">
                Provider: {selectedRecord.provider}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              {selectedRecord.details}
            </p>

            <button
              onClick={() => setSelectedRecord(null)}
              className="mt-6 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}