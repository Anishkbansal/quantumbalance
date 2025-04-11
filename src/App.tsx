import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Layouts
import Layout from './components/layout/Layout';

// Auth
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import VerificationRequired from './components/auth/VerificationRequired';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import HealthQuestionnaire from './pages/HealthQuestionnaire';
import QuestionnaireHistory from './pages/QuestionnaireHistory';
import QuestionnaireDetails from './pages/QuestionnaireDetails';
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMessages from './pages/admin/Messages';
import NotFound from './pages/NotFound';
import About from './pages/About';
import ScientificEvidence from './pages/ScientificEvidence';
import ScalarHealing from './pages/ScalarHealing';
import Packages from './pages/Packages';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import VerifyEmail from './pages/auth/VerifyEmail';
import Profile from './pages/Profile';
import PaymentMethods from './pages/Profile/PaymentMethods';
import Prescriptions from './pages/Prescriptions';
import WellnessLogs from './pages/WellnessLogs';
import Analysis from './pages/Analysis';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes within main layout */}
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/scientific-evidence" element={<ScientificEvidence />} />
            <Route path="/scalar-healing" element={<ScalarHealing />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Authentication required routes */}
            <Route element={<ProtectedRoute />}>
              {/* Routes that also require email verification */}
              <Route element={<VerificationRequired />}>
                <Route path="/health-questionnaire" element={<HealthQuestionnaire />} />
                <Route path="/questionnaire-history" element={<QuestionnaireHistory />} />
                <Route path="/questionnaire-details/:id" element={<QuestionnaireDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/payment-methods" element={<PaymentMethods />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/wellness-logs" element={<WellnessLogs />} />
                <Route path="/analysis" element={<Analysis />} />
              </Route>
            </Route>
            
            {/* Admin routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/create-user" element={<CreateUser />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 