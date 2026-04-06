import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import JobsPage from './pages/JobsPage';
import WorkersPage from './pages/WorkersPage';
import ProfilePage from './pages/ProfilePage';
import MyProfilePage from './pages/MyProfilePage';
import ChatPage from './pages/ChatPage';
import StatisticsPage from './pages/StatisticsPage';
import EmployerDashboard from './pages/employer/Dashboard';
import WorkerServices from './pages/employer/WorkerServices';
import WorkerDashboard from './pages/worker/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminContracts from './pages/admin/Contracts';
import AdminDisputes from './pages/admin/Disputes';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import JobsManagement from './pages/admin/JobsManagement';
import VerificationManagement from './pages/admin/VerificationManagement';
import CreateJob from './pages/employer/CreateJob';
import CreateServicePost from './pages/worker/CreateServicePost';
import MyServicePosts from './pages/worker/MyServicePosts';
import ContractPage from './pages/ContractPage';
import VerificationPage from './pages/VerificationPage';
import NotificationsPage from './pages/NotificationsPage';
import EmployerApplications from './pages/employer/Applications';
import EmployerJobDetails from './pages/employer/JobDetails';
import CreateContract from './pages/employer/CreateContract';
import WorkerApplications from './pages/worker/Applications';
import WorkerContracts from './pages/worker/Contracts';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ChatAssistant from './components/ChatAssistant';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/home" element={<LandingPage />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />
                <Route path="/jobs" element={<JobsPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/worker/:userId" element={<ProfilePage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        
        {/* Protected Routes */}
        <Route path="/my-profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/contracts/:contractId" element={<ProtectedRoute><ContractPage /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />

        {/* Worker Routes */}
        <Route path="/worker/dashboard" element={<RoleProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></RoleProtectedRoute>} />
        <Route path="/worker/applications" element={<RoleProtectedRoute allowedRoles={['worker']}><WorkerApplications /></RoleProtectedRoute>} />
        <Route path="/worker/contracts" element={<RoleProtectedRoute allowedRoles={['worker']}><WorkerContracts /></RoleProtectedRoute>} />
        <Route path="/worker/service-posts" element={<RoleProtectedRoute allowedRoles={['worker']}><MyServicePosts /></RoleProtectedRoute>} />
        <Route path="/worker/create-service" element={<RoleProtectedRoute allowedRoles={['worker']}><CreateServicePost /></RoleProtectedRoute>} />
        <Route path="/worker/edit-service/:postId" element={<RoleProtectedRoute allowedRoles={['worker']}><CreateServicePost /></RoleProtectedRoute>} />
        
        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={<RoleProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></RoleProtectedRoute>} />
        <Route path="/employer/applicants" element={<RoleProtectedRoute allowedRoles={['employer']}><EmployerApplications /></RoleProtectedRoute>} />
        <Route path="/employer/create-contract" element={<RoleProtectedRoute allowedRoles={['employer']}><CreateContract /></RoleProtectedRoute>} />
        <Route path="/employer/jobs/:jobId" element={<RoleProtectedRoute allowedRoles={['employer']}><EmployerJobDetails /></RoleProtectedRoute>} />
        <Route path="/employer/create-job" element={<RoleProtectedRoute allowedRoles={['employer']}><CreateJob /></RoleProtectedRoute>} />
        <Route path="/employer/worker-services" element={<RoleProtectedRoute allowedRoles={['employer']}><WorkerServices /></RoleProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/admin/users" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><UsersManagement /></RoleProtectedRoute>} />
        <Route path="/admin/jobs" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><JobsManagement /></RoleProtectedRoute>} />
        <Route path="/admin/contracts" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminContracts /></RoleProtectedRoute>} />
        <Route path="/admin/disputes" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDisputes /></RoleProtectedRoute>} />
        <Route path="/admin/verification" element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']}><VerificationManagement /></RoleProtectedRoute>} />

        {/* Super Admin Routes */}
        <Route path="/super-admin/dashboard" element={<RoleProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></RoleProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              <ChatAssistant />
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
</ThemeProvider>
  );
}
