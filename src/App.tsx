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
import { CurrencyProvider } from './contexts/CurrencyContext';

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
import SonicLibrary from './pages/admin/SonicLibrary';
import AdminGiftCards from './pages/admin/AdminGiftCards';
import NotFound from './pages/NotFound';
import About from './pages/About';
import ScientificEvidence from './pages/ScientificEvidence';
import ScalarHealing from './pages/ScalarHealing';
import Packages from './pages/Packages';
import GiftCards from './pages/GiftCards';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import VerifyEmail from './pages/auth/VerifyEmail';
import Profile from './pages/Profile';
import PaymentMethods from './pages/Profile/PaymentMethods';
import Prescriptions from './pages/Prescriptions';
import WellnessLogs from './pages/WellnessLogs';
import Analysis from './pages/Analysis';
import ForgotPassword from './pages/auth/ForgotPassword';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
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
              <Route path="/gift-cards" element={<GiftCards />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Authentication required routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<VerificationRequired />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/payment-methods" element={<PaymentMethods />} />
                  <Route path="/health-questionnaire" element={<HealthQuestionnaire />} />
                  <Route path="/questionnaire-history" element={<QuestionnaireHistory />} />
                  <Route path="/questionnaire/:id" element={<QuestionnaireDetails />} />
                  <Route path="/prescriptions" element={<Prescriptions />} />
                  <Route path="/wellness-logs" element={<WellnessLogs />} />
                  <Route path="/analysis" element={<Analysis />} />
                </Route>
              </Route>
              
              {/* Admin routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/users/create" element={<CreateUser />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/sonic-library" element={<SonicLibrary />} />
                <Route path="/admin/gift-cards" element={<AdminGiftCards />} />
              </Route>
              
              {/* Catch all route - 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App; 