import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User, Mail, Shield, Stethoscope as SpecialtyIcon, Pencil, Check, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [age, setAge] = useState(user?.age || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const startEdit = () => {
    setFullName(user?.full_name || "");
    setSpecialty(user?.specialty || "");
    setAge(user?.age || "");
    setGender(user?.gender || "");
    setAllergies(user?.allergies || "");
    setError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch("/api/auth/me", {
        full_name: fullName,
        specialty: user?.role === "doctor" ? specialty : undefined,
        age: user?.role === "patient" && age !== "" ? Number(age) : undefined,
        gender: user?.role === "patient" ? gender : undefined,
        allergies: user?.role === "patient" ? allergies : undefined,
      });
      await refreshUser?.();
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Settings</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Account</h2>
            {!editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              {user?.role === "doctor" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              )}
              {user?.role === "patient" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Allergies</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 transition disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="divide-y divide-slate-100">
              <div className="flex items-center gap-3 py-3">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <dt className="text-sm text-slate-500 w-24 shrink-0">Name</dt>
                <dd className="text-sm font-semibold text-slate-800">{user?.full_name || "-"}</dd>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <dt className="text-sm text-slate-500 w-24 shrink-0">Email</dt>
                <dd className="text-sm font-semibold text-slate-800">{user?.email || "-"}</dd>
              </div>
              <div className="flex items-center gap-3 py-3">
                <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                <dt className="text-sm text-slate-500 w-24 shrink-0">Role</dt>
                <dd className="text-sm font-semibold text-slate-800 capitalize">{user?.role || "-"}</dd>
              </div>
              {user?.specialty && (
                <div className="flex items-center gap-3 py-3">
                  <SpecialtyIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <dt className="text-sm text-slate-500 w-24 shrink-0">Specialty</dt>
                  <dd className="text-sm font-semibold text-slate-800">{user.specialty}</dd>
                </div>
              )}
              {user?.role === "patient" && (
                <>
                  <div className="flex items-center gap-3 py-3">
                    <dt className="text-sm text-slate-500 w-24 shrink-0 pl-7">Age</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.age || "Not set"}</dd>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <dt className="text-sm text-slate-500 w-24 shrink-0 pl-7">Gender</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.gender || "Not set"}</dd>
                  </div>
                  <div className="flex items-center gap-3 py-3">
                    <dt className="text-sm text-slate-500 w-24 shrink-0 pl-7">Allergies</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.allergies || "None recorded"}</dd>
                  </div>
                </>
              )}
            </dl>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 text-sm transition"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </main>
    </div>
  );
}
