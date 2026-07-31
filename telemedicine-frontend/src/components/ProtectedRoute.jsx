import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Wrap any <Route element={...}> with this to require login (and optionally a role).
// Usage: <Route path="/dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
