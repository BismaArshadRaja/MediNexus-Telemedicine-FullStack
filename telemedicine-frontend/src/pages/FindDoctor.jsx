import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
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
  Star,
  SearchX,
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

// Backend only stores id/name/specialty for doctors. These display extras
// (avatar color, rating, fee, availability slot) aren't real clinical/business
// data yet, so we derive stable placeholders per doctor id until you add
// those fields to the backend (e.g. a doctor profile/settings table).
const avatarPalette = [
  { bg: "#CCFBF1", text: "#115E59" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
];

function decorateDoctor(doc, idx) {
  const palette = avatarPalette[idx % avatarPalette.length];
  const initials = doc.full_name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: doc.id,
    initials,
    avatarBg: palette.bg,
    avatarText: palette.text,
    name: doc.full_name,
    specialty: doc.specialty || "General Medicine",
    quals: "MBBS, FCPS",
    languages: ["Urdu", "English"],
    rating: 4.8,
    reviews: 50 + idx * 12,
    fee: 1500 + idx * 250,
    mode: "Video consultation",
    earliest: idx % 2 === 0 ? "Today 3:30 PM" : "Tomorrow 10:00 AM",
    availability: idx % 2 === 0 ? "today" : "tomorrow",
  };
}
const languagesList = ["Urdu", "English", "Punjabi"];
const availabilityOptions = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];
const feeRanges = [
  { value: "under1500", label: "Under Rs 1,500", test: (f) => f < 1500 },
  { value: "1500-2000", label: "Rs 1,500 - 2,000", test: (f) => f >= 1500 && f <= 2000 },
  { value: "over2000", label: "Over Rs 2,000", test: (f) => f > 2000 },
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

export default function FindDoctor() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("");
  const [feeRange, setFeeRange] = useState("");
  const [bookedDoctor, setBookedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/doctors/")
      .then(({ data }) => setDoctors(data.map(decorateDoctor)))
      .catch(() => setError("Couldn't load the doctor list. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const specialties = useMemo(
    () => [...new Set(doctors.map((d) => d.specialty))],
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q);
      const matchesSpecialty = !specialty || doc.specialty === specialty;
      const matchesLanguage = !language || doc.languages.includes(language);
      const matchesAvailability =
        !availability || doc.availability === availability;
      const feeRule = feeRanges.find((r) => r.value === feeRange);
      const matchesFee = !feeRule || feeRule.test(doc.fee);

      return (
        matchesQuery &&
        matchesSpecialty &&
        matchesLanguage &&
        matchesAvailability &&
        matchesFee
      );
    });
  }, [query, specialty, language, availability, feeRange]);

  const hasActiveFilters =
    query || specialty || language || availability || feeRange;

  const clearFilters = () => {
    setQuery("");
    setSpecialty("");
    setLanguage("");
    setAvailability("");
    setFeeRange("");
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

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
              Find a Doctor
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
          {/* SEARCH AND FILTERS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Search and filters
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
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
              placeholder="Search doctor, specialty or condition"
              className={`mt-4 ${fieldClass}`}
            />

            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={fieldClass}
              >
                <option value="">Specialty</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={fieldClass}
              >
                <option value="">Language</option>
                {languagesList.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className={fieldClass}
              >
                <option value="">Availability</option>
                {availabilityOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>

              <select
                value={feeRange}
                onChange={(e) => setFeeRange(e.target.value)}
                className={fieldClass}
              >
                <option value="">Fee range</option>
                {feeRanges.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RESULTS COUNT */}
          <p className="text-xs sm:text-sm text-slate-500 px-1">
            {filteredDoctors.length}{" "}
            {filteredDoctors.length === 1 ? "doctor" : "doctors"} found
          </p>

          {/* DOCTOR LIST */}
          {loading ? (
            <Loader label="Finding doctors..." />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
              {error}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 sm:p-14 flex flex-col items-center text-center">
              <SearchX className="h-10 w-10 text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700">
                No doctors match your filters
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting or clearing your search and filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 text-sm transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-4 sm:gap-5 lg:flex-1 min-w-0">
                      <div
                        style={{ backgroundColor: doc.avatarBg, color: doc.avatarText }}
                        className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 shrink-0 rounded-full flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-extrabold"
                      >
                        {doc.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-base sm:text-lg lg:text-xl">
                          {doc.name}
                        </p>
                        <p className="text-teal-700 font-semibold text-sm sm:text-base mt-0.5">
                          {doc.specialty}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                          {doc.quals}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          {doc.languages.join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Rating + fee + Slot + book */}
                    <div className="flex flex-col sm:flex-row lg:flex-row gap-4 sm:gap-6 lg:gap-10 pl-0 lg:pl-0">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 w-fit">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {doc.rating} ({doc.reviews})
                        </span>
                        <p className="font-extrabold text-slate-900 text-lg sm:text-xl">
                          Rs {doc.fee.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{doc.mode}</p>
                      </div>

                      <div className="w-full sm:w-52 shrink-0">
                        <p className="text-xs sm:text-sm text-slate-500">
                          Earliest slot
                        </p>
                        <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 mb-3">
                          {doc.earliest}
                        </p>
                        <button
                          onClick={() =>
                            navigate("/book-appointment", {
                              state: {
                                doctorId: doc.id,
                                doctorName: doc.name,
                                doctorInitials: doc.initials,
                                doctorSpecialty: doc.specialty,
                              },
                            })
                          }
                          className="w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 text-sm whitespace-nowrap transition"
                        >
                          View profile &amp; book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      {bookedDoctor && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setBookedDoctor(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-[280px] sm:max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl">
            <div className="mx-auto h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
              <span className="text-teal-700 text-lg">✓</span>
            </div>
            <p className="mt-3 font-bold text-slate-900 text-sm">
              Booking request sent
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {bookedDoctor} will confirm your appointment shortly.
            </p>
            <button
              onClick={() => setBookedDoctor(null)}
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2 text-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}