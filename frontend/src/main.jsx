import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicPortfolio from './pages/PublicPortfolio';
import AdminLogin from './pages/AdminLogin';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public portfolio */}
        <Route path="/" element={<PublicPortfolio />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

createRoot(document.getElementById('root')).render(<App />);

