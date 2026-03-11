import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import {
  InternDashboard,
  InternLogs,
  InternTasks,
  InternExpenses,
  InternStipend,
  InternAttendance,
  InternLeave,
  InternWFH,
  InternProjects,
  InternRelieving,
  InternComplaints,
  InternKT,
} from './pages/intern/InternPages';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerLogs from './pages/manager/ManagerLogs';
import ManagerTasks from './pages/manager/ManagerTasks';
import ManagerExpenses from './pages/manager/ManagerExpenses';
import ManagerInvites from './pages/manager/ManagerInvites';
import ManagerLeaves from './pages/manager/ManagerLeaves';
import ManagerWFH from './pages/manager/ManagerWFH';
import {
  ManagerStipends,
  ManagerInterns,
  ManagerAttendance,
  ManagerRelievings,
  ManagerComplaints,
  ManagerReports,  // ADD
  ManagerKT,
} from './pages/manager/ManagerPages';
import ManagerProjects from './pages/manager/Managerprojects';
import CEODashboard from './pages/ceo/CEODashboard';
import CEOProjects from './pages/ceo/Ceoprojects';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    if (user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  const RootRedirect = () => {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (user?.role === 'ceo') return <Navigate to="/ceo" replace />;
    if (user?.role === 'manager') return <Navigate to="/manager" replace />;
    if (user?.role === 'intern') return <Navigate to="/intern" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ── Intern routes ── */}
      <Route path="/intern" element={<ProtectedRoute allowedRoles={['intern']}><InternDashboard /></ProtectedRoute>} />
      <Route path="/intern/logs" element={<ProtectedRoute allowedRoles={['intern']}><InternLogs /></ProtectedRoute>} />
      <Route path="/intern/tasks" element={<ProtectedRoute allowedRoles={['intern']}><InternTasks /></ProtectedRoute>} />
      <Route path="/intern/expenses" element={<ProtectedRoute allowedRoles={['intern']}><InternExpenses /></ProtectedRoute>} />
      <Route path="/intern/stipend" element={<ProtectedRoute allowedRoles={['intern']}><InternStipend /></ProtectedRoute>} />
      <Route path="/intern/attendance" element={<ProtectedRoute allowedRoles={['intern']}><InternAttendance /></ProtectedRoute>} />
      <Route path="/intern/leave" element={<ProtectedRoute allowedRoles={['intern']}><InternLeave /></ProtectedRoute>} />
      <Route path="/intern/wfh" element={<ProtectedRoute allowedRoles={['intern']}><InternWFH /></ProtectedRoute>} />
      <Route path="/intern/projects" element={<ProtectedRoute allowedRoles={['intern']}><InternProjects /></ProtectedRoute>} />
      <Route path="/intern/relieving" element={<ProtectedRoute allowedRoles={['intern']}><InternRelieving /></ProtectedRoute>} />
      <Route path="/intern/complaints" element={<ProtectedRoute allowedRoles={['intern']}><InternComplaints /></ProtectedRoute>} />
      <Route
  path="/intern/kt"
  element={
    <ProtectedRoute allowedRoles={['intern']}>
      <InternKT />
    </ProtectedRoute>
  }
/>

      {/* ── Manager routes ── */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/logs" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerLogs /></ProtectedRoute>} />
      <Route path="/manager/tasks" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerTasks /></ProtectedRoute>} />
      <Route path="/manager/expenses" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerExpenses /></ProtectedRoute>} />
      <Route path="/manager/invites" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerInvites /></ProtectedRoute>} />
      <Route path="/manager/leaves" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerLeaves /></ProtectedRoute>} />
      <Route path="/manager/wfh" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerWFH /></ProtectedRoute>} />
      <Route path="/manager/stipends" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerStipends /></ProtectedRoute>} />
      <Route path="/manager/interns" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerInterns /></ProtectedRoute>} />
      <Route path="/manager/attendance" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerAttendance /></ProtectedRoute>} />
      <Route path="/manager/projects" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerProjects /></ProtectedRoute>} />
      <Route path="/manager/relievings" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerRelievings /></ProtectedRoute>} />
      <Route path="/manager/complaints" element={<ProtectedRoute allowedRoles={['manager', 'ceo']}><ManagerComplaints /></ProtectedRoute>} />
      <Route
  path="/manager/reports"
  element={
    <ProtectedRoute allowedRoles={['manager', 'ceo']}>
      <ManagerReports />
    </ProtectedRoute>
  }
/>
<Route
  path="/manager/kt"
  element={
    <ProtectedRoute allowedRoles={['manager', 'ceo']}>
      <ManagerKT />
    </ProtectedRoute>
  }
/>
      {/* ── CEO routes ── */}
      <Route path="/ceo" element={<ProtectedRoute allowedRoles={['ceo']}><CEODashboard /></ProtectedRoute>} />
      <Route path="/ceo/projects" element={<ProtectedRoute allowedRoles={['ceo']}><CEOProjects /></ProtectedRoute>} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;