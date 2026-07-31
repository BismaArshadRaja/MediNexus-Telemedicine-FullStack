import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  { icon: LayoutDashboard, label: "Dashboard", route: "/doctor-dashboard" },
  { icon: Clock, label: "Schedule" },
  { icon: Users, label: "Patients", active: true, route: "/patient-clinical-workspace" },
  { icon: Stethoscope, label: "Consultations" },
  { icon: ShieldCheck, label: "Clinical AI", route: "/clinical-ai-review" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const timelineDot = {
  report: "bg-blue-600",
  health_record: "bg-teal-700",
  test_order: "bg-violet-600",
  care_plan: "bg-orange-500",
  appointment: "bg-slate-500",
};

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
          <p className="text-xs text-slate-400 leading-tight">AI Telemedicine</p>
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
            <span className={`h-2 w-2 rounded-full ${active ? "bg-teal-400" : "bg-slate-600"}`} />
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function PatientClinicalWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState("");
  const [selectedId, setSelectedId] = useState(location.state?.patientId || null);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const [timelineDetail, setTimelineDetail] = useState(null);

  const [orderTestOpen, setOrderTestOpen] = useState(false);
  const [testType, setTestType] = useState("CBC");
  const [testNote, setTestNote] = useState("");
  const [orderingTest, setOrderingTest] = useState(false);

  const [carePlanOpen, setCarePlanOpen] = useState(false);
  const [carePlanText, setCarePlanText] = useState("");
  const [sendingPlan, setSendingPlan] = useState(false);

  const [aiBrief, setAiBrief] = useState("");
  const [aiBriefLoading, setAiBriefLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  };

  // 1. Load the doctor's real patient list (anyone they have a real appointment with)
  useEffect(() => {
    api
      .get("/api/patients/mine")
      .then(({ data }) => {
        setPatients(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      })
      .catch(() =>
        setPatientsError(
          "Couldn't load your patients. You'll see patients here once someone books an appointment with you."
        )
      )
      .finally(() => setPatientsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Load full clinical detail for the selected patient
  const loadDetail = (id) => {
    setDetailLoading(true);
    setDetailError("");
    api
      .get(`/api/patients/${id}/detail`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetailError("Couldn't load this patient's clinical detail."))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  const openEdit = () => {
    setEditDraft(detail?.snapshot || {});
    setEditOpen(true);
  };

  const saveSnapshot = async () => {
    setSaving(true);
    try {
      await api.put(`/api/patients/${selectedId}/snapshot`, editDraft);
      await loadDetail(selectedId);
      setEditOpen(false);
      showToast("Clinical profile updated.");
    } catch {
      showToast("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openTimelineItem = (item) => {
    if (item.route) navigate(item.route);
    else setTimelineDetail(item);
  };

  const submitOrderTest = async () => {
    setOrderingTest(true);
    try {
      await api.post(`/api/patients/${selectedId}/test-orders`, {
        test_type: testType,
        note: testNote || null,
      });
      await loadDetail(selectedId);
      setOrderTestOpen(false);
      setTestNote("");
      showToast(`${testType} order sent for ${detail?.patient?.full_name || "this patient"}.`);
    } catch {
      showToast("Couldn't send the test order. Please try again.");
    } finally {
      setOrderingTest(false);
    }
  };

  const sendCarePlan = async () => {
    if (!carePlanText.trim()) return;
    setSendingPlan(true);
    try {
      await api.post(`/api/patients/${selectedId}/care-plan`, { plan_text: carePlanText });
      await loadDetail(selectedId);
      setCarePlanOpen(false);
      showToast(`Care plan sent to ${detail?.patient?.full_name || "this patient"}.`);
    } catch {
      showToast("Couldn't send the care plan. Please try again.");
    } finally {
      setSendingPlan(false);
    }
  };

  const generateAiBrief = async () => {
    if (!detail) return;
    setAiBriefLoading(true);
    try {
      const noteText = [
        `Patient: ${detail.patient.full_name}, age ${detail.patient.age || "unknown"}, ${detail.patient.gender || "gender not recorded"}.`,
        detail.patient.allergies ? `Allergies: ${detail.patient.allergies}.` : "No allergies recorded.",
        `Clinical snapshot: blood group ${detail.snapshot.blood_group || "unknown"}, chronic conditions ${detail.snapshot.chronic_conditions || "none recorded"}, last BP ${detail.snapshot.last_bp || "not recorded"}, last glucose ${detail.snapshot.last_glucose || "not recorded"}.`,
        "Recent timeline: " +
          detail.timeline
            .slice(0, 5)
            .map((t) => `${t.title} (${t.sub})`)
            .join("; "),
      ].join(" ");
      const { data } = await api.post("/api/ai/clinical-review", {
        patient_id: detail.patient.id,
        note_text: noteText,
      });
      setAiBrief(data.ai_review);
    } catch {
      setAiBrief("Couldn't generate an AI brief right now. Please try again.");
    } finally {
      setAiBriefLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

  const patient = detail?.patient;
  const snapshot = detail?.snapshot || {};
  const timeline = detail?.timeline || [];
  const evidenceRecords = timeline.filter((t) => t.kind === "report" || t.kind === "health_record");

  const encounterActions = [
    {
      key: "consult",
      label: "Start consultation",
      bg: "bg-teal-700 hover:bg-teal-800",
      onClick: () =>
        navigate("/video-consultation", {
          state: { doctorName: patient?.full_name, initials: (patient?.full_name || "PT").slice(0, 2).toUpperCase() },
        }),
    },
    {
      key: "prescription",
      label: "Create prescription",
      bg: "bg-blue-600 hover:bg-blue-700",
      onClick: () => navigate("/prescription-safety-review"),
    },
    {
      key: "order",
      label: "Order test",
      bg: "bg-violet-600 hover:bg-violet-700",
      onClick: () => setOrderTestOpen(true),
    },
    {
      key: "careplan",
      label: "Send care plan",
      bg: "bg-orange-600 hover:bg-orange-700",
      onClick: () => {
        setCarePlanText("");
        setCarePlanOpen(true);
      },
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full flex bg-slate-50 font-sans overflow-x-hidden">
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col bg-[#0b1220] text-white px-4 py-6">
        <SidebarContent />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-[#0b1220] text-white px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wide text-slate-400 px-2">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 truncate">
              Patient Clinical Workspace
            </h1>
          </div>

          {/* PATIENT SELECTOR - real patients from real appointments */}
          {patients.length > 0 && (
            <select
              value={selectedId || ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          )}
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {patientsLoading || detailLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : patientsError || patients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {patientsError || "You don't have any patients yet - once someone books an appointment with you, they'll show up here."}
            </div>
          ) : detailError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
              {detailError}
            </div>
          ) : (
            <>
              {/* PATIENT HEADER */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {patient.full_name}
                    {patient.age ? ` • ${patient.age} years` : ""}
                    {patient.gender ? ` • ${patient.gender}` : ""} • Patient ID P-{String(patient.id).padStart(4, "0")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Last visit: {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : "No visits yet"}
                  </p>
                </div>
                {patient.allergies && (
                  <span className="shrink-0 w-fit rounded-full bg-red-50 text-red-700 text-xs sm:text-sm font-bold px-3.5 py-1.5">
                    Allergy: {patient.allergies}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
                {/* PATIENT SNAPSHOT */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Patient snapshot</h2>

                  <div className="mt-4 divide-y divide-slate-100">
                    {[
                      ["Blood group", snapshot.blood_group],
                      ["Chronic conditions", snapshot.chronic_conditions],
                      ["Current medicines", snapshot.current_medicines],
                      ["Last BP", snapshot.last_bp],
                      ["Last glucose", snapshot.last_glucose],
                      ["Smoking", snapshot.smoking],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="font-bold text-slate-900 text-sm text-right">{value || "Not recorded"}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={openEdit}
                    className="mt-5 w-full rounded-lg border-2 border-teal-700 text-teal-700 font-semibold py-2.5 text-sm hover:bg-teal-50 transition"
                  >
                    Edit clinical profile
                  </button>
                </div>

                {/* TIMELINE - built from real appointments, reports, records, test orders, care plans */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Timeline</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Consultations, reports, test orders and care plans
                  </p>

                  {timeline.length === 0 ? (
                    <p className="mt-6 text-sm text-slate-400">Nothing recorded yet for this patient.</p>
                  ) : (
                    <ol className="mt-6 relative border-l border-slate-200 ml-3">
                      {timeline.map((item) => (
                        <li key={item.id} className="ml-6 pb-7 last:pb-0">
                          <span className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${timelineDot[item.kind] || "bg-slate-400"}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-500">
                                {new Date(item.date).toLocaleDateString()}
                              </p>
                              <p className="font-bold text-slate-900 text-sm mt-0.5">{item.title}</p>
                              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{item.sub}</p>
                            </div>
                            <button
                              onClick={() => openTimelineItem(item)}
                              className="shrink-0 rounded-lg border border-slate-300 text-slate-700 font-semibold px-4 py-1.5 text-xs sm:text-sm hover:bg-slate-50 transition"
                            >
                              Open
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* AI CLINICAL BRIEF + ENCOUNTER ACTIONS */}
                <div className="space-y-5 sm:space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">AI clinical brief</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Generated from this patient's real record</p>

                    {aiBrief ? (
                      <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{aiBrief}</p>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">
                        Click below to have Groq generate a brief from this patient's real snapshot and timeline.
                      </p>
                    )}

                    <button
                      onClick={generateAiBrief}
                      disabled={aiBriefLoading}
                      className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
                    >
                      {aiBriefLoading ? "Generating..." : "Generate AI brief"}
                    </button>

                    <span className="inline-block mt-4 rounded-full bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5">
                      Evidence: {evidenceRecords.length} record(s)
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Encounter actions</h2>
                    <div className="mt-4 space-y-3">
                      {encounterActions.map((a) => (
                        <button
                          key={a.key}
                          onClick={a.onClick}
                          className={`w-full rounded-lg ${a.bg} text-white font-semibold py-2.5 sm:py-3 text-sm transition`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* EDIT CLINICAL PROFILE MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-base">Edit clinical profile</p>
              <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {[
                ["blood_group", "Blood group"],
                ["chronic_conditions", "Chronic conditions"],
                ["current_medicines", "Current medicines"],
                ["last_bp", "Last BP"],
                ["last_glucose", "Last glucose"],
                ["smoking", "Smoking"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                  <input
                    value={editDraft[key] || ""}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditOpen(false)} className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={saveSnapshot}
                disabled={saving}
                className="flex-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE DETAIL MODAL */}
      {timelineDetail && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTimelineDetail(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            <p className="text-xs font-semibold text-slate-500">
              {new Date(timelineDetail.date).toLocaleString()}
            </p>
            <p className="font-bold text-slate-900 text-base mt-0.5">{timelineDetail.title}</p>
            <p className="text-sm text-slate-700 mt-3 leading-relaxed">
              {timelineDetail.detail || timelineDetail.sub}
            </p>
            <button
              onClick={() => setTimelineDetail(null)}
              className="mt-5 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ORDER TEST MODAL */}
      {orderTestOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOrderTestOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            <p className="font-bold text-slate-900 text-base">Order test</p>
            <p className="text-xs text-slate-500 mt-1">For {patient?.full_name}</p>

            <label className="block text-xs font-semibold text-slate-500 mt-4 mb-1">Test type</label>
            <select value={testType} onChange={(e) => setTestType(e.target.value)} className={fieldClass}>
              <option>CBC</option>
              <option>Fasting glucose</option>
              <option>Chest X-ray</option>
              <option>Lipid profile</option>
              <option>Thyroid panel</option>
            </select>

            <label className="block text-xs font-semibold text-slate-500 mt-4 mb-1">Note (optional)</label>
            <textarea
              value={testNote}
              onChange={(e) => setTestNote(e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none`}
              placeholder="Any specific instructions for the lab"
            />

            <div className="mt-5 flex gap-3">
              <button onClick={() => setOrderTestOpen(false)} className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={submitOrderTest}
                disabled={orderingTest}
                className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
              >
                {orderingTest ? "Sending..." : "Send order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND CARE PLAN MODAL */}
      {carePlanOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCarePlanOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            <p className="font-bold text-slate-900 text-base">Send care plan</p>
            <p className="text-xs text-slate-500 mt-1">To {patient?.full_name}</p>

            <textarea
              value={carePlanText}
              onChange={(e) => setCarePlanText(e.target.value)}
              rows={5}
              placeholder="e.g. Continue fluids and rest. Recheck fasting glucose in 2 weeks..."
              className={`${fieldClass} mt-4 resize-none`}
            />

            <div className="mt-5 flex gap-3">
              <button onClick={() => setCarePlanOpen(false)} className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold py-2.5 text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={sendCarePlan}
                disabled={sendingPlan}
                className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
              >
                {sendingPlan ? "Sending..." : "Send"}
              </button>
            </div>
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
