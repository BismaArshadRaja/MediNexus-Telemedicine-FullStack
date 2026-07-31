import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";

// Built from real data (your appointments + reports) rather than a fake feed -
// there's no separate notifications table in the backend yet.
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([api.get("/api/appointments/mine"), api.get("/api/reports/")])
      .then(([apptRes, reportRes]) => {
        const notifs = [];
        if (apptRes.status === "fulfilled") {
          apptRes.value.data
            .filter((a) => new Date(a.scheduled_time) >= new Date())
            .forEach((a) =>
              notifs.push({
                icon: CalendarDays,
                title: "Upcoming appointment",
                detail: `${a.doctor_name || `Doctor #${a.doctor_id}`} - ${new Date(
                  a.scheduled_time
                ).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
                time: a.scheduled_time,
              })
            );
        }
        if (reportRes.status === "fulfilled") {
          reportRes.value.data.forEach((r) =>
            notifs.push({
              icon: FileText,
              title: r.summary ? "Report summarized" : "Report uploaded",
              detail: r.filename,
              time: r.created_at,
            })
          );
        }
        notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
        setItems(notifs);
      })
      .catch(() => setError("Couldn't load notifications right now."))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Notifications</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <Loader label="Loading notifications..." />
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            No notifications yet. Book an appointment or upload a report to see updates here.
          </p>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {items.map((n, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4">
                <span className="h-9 w-9 shrink-0 rounded-full bg-teal-50 flex items-center justify-center">
                  <n.icon className="h-4 w-4 text-teal-700" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
