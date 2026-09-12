import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (forgotMode) {
        const result = await authAPI.forgotPassword(email);
        if (!result.success) {
          setError(result.message || 'Unable to send the reset email.');
        } else {
          setMessage(result.message);
        }
        return;
      }

      const result = await authAPI.login(email, password);
      if (!result.success) {
        setError(result.message || 'Login failed');
        return;
      }
      // Login successful, redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <h1>{forgotMode ? 'Forgot Password' : 'Admin Login'}</h1>
        {forgotMode && <p className="login-help">Enter your admin email and we will send you a password reset link.</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your-email@example.com"
              disabled={loading}
            />
          </div>

          {!forgotMode && <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>}

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Please wait...' : forgotMode ? 'Send Reset Link' : 'Login'}
          </button>
        </form>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setForgotMode(!forgotMode);
            setError('');
            setMessage('');
          }}
          disabled={loading}
        >
          {forgotMode ? 'Back to login' : 'Forgot password?'}
        </button>
      </div>
    </div>
  );
}
