import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import SymptomCheckerChat from "./pages/SymptomCheckerChat";
import TriageSummary from "./pages/TriageSummary";
import FindDoctor from "./pages/FindDoctor";
import BookAppointment from "./pages/BookAppointment";
import VideoConsultation from "./pages/VideoConsultation";
import HealthRecords from "./pages/HealthRecords";
import ReportUpload from "./pages/ReportUpload";
import ReportSummary from "./pages/ReportSummary";
import ReportChat from "./pages/ReportChat";
import PrescriptionSafetyReview from "./pages/PrescriptionSafetyReview";
import XrayAnalysisViewer from "./pages/XrayAnalysisViewer";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientClinicalWorkspace from "./pages/PatientClinicalWorkspace";
import ClinicalAIReview from "./pages/ClinicalAIReview";
import AdminDashboard from "./pages/AdminDashboard";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Patient-facing pages */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/symptom-checker" element={<ProtectedRoute allowedRoles={["patient"]}><SymptomCheckerChat /></ProtectedRoute>} />
      <Route path="/triage-summary" element={<ProtectedRoute allowedRoles={["patient"]}><TriageSummary /></ProtectedRoute>} />
      <Route path="/find-doctor" element={<ProtectedRoute allowedRoles={["patient"]}><FindDoctor /></ProtectedRoute>} />
      <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={["patient"]}><BookAppointment /></ProtectedRoute>} />
      <Route path="/health-records" element={<ProtectedRoute allowedRoles={["patient"]}><HealthRecords /></ProtectedRoute>} />
      <Route path="/upload-report" element={<ProtectedRoute allowedRoles={["patient"]}><ReportUpload /></ProtectedRoute>} />
      <Route path="/report-summary" element={<ProtectedRoute allowedRoles={["patient"]}><ReportSummary /></ProtectedRoute>} />
      <Route path="/report-chat" element={<ProtectedRoute allowedRoles={["patient"]}><ReportChat /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/video-consultation" element={<ProtectedRoute><VideoConsultation /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Doctor-facing pages */}
      <Route path="/prescription-safety-review" element={<ProtectedRoute allowedRoles={["doctor"]}><PrescriptionSafetyReview /></ProtectedRoute>} />
      <Route path="/xray-analysis" element={<ProtectedRoute allowedRoles={["doctor"]}><XrayAnalysisViewer /></ProtectedRoute>} />
      <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/patient-clinical-workspace" element={<ProtectedRoute allowedRoles={["doctor"]}><PatientClinicalWorkspace /></ProtectedRoute>} />
      <Route path="/clinical-ai-review" element={<ProtectedRoute allowedRoles={["doctor"]}><ClinicalAIReview /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
