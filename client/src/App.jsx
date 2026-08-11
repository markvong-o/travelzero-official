import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import FocusedLayout from './layouts/FocusedLayout';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import ExperimentCenter from './pages/ExperimentCenter';
import SecurityInterstitial from './pages/SecurityInterstitial';
import Gemini from './pages/Gemini';
import MobileApp from './pages/MobileApp';
import { isAuth0Configured, getAuth0Config } from './lib/auth-config';
import './styles/index.css';
import './styles/theme.css';
import './styles/global.css';

function AppRoutes() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Browse />} />
            </Route>

            <Route element={<FocusedLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/security-interstitial" element={<SecurityInterstitial />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/admin/experiments" element={<ExperimentCenter />} />
            </Route>

            {/* Gemini mocks an external app with delegated access — it stays
                outside every layout so it never wears TravelZero's chrome. */}
            <Route path="/gemini" element={<Gemini />} />
            <Route path="/mobile" element={<MobileApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

// Only mounted when real VITE_AUTH0_* env vars are present; redirects back to the
// app root and restores whatever path the user was on before the Universal Login trip.
function Auth0ProviderWithRedirect({ children }) {
  const navigate = useNavigate();
  const { domain, clientId, audience } = getAuth0Config();

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
      }}
      onRedirectCallback={(appState) => navigate(appState?.returnTo || window.location.pathname)}
    >
      {children}
    </Auth0Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {isAuth0Configured() ? (
        <Auth0ProviderWithRedirect>
          <AppRoutes />
        </Auth0ProviderWithRedirect>
      ) : (
        <AppRoutes />
      )}
    </BrowserRouter>
  );
}
