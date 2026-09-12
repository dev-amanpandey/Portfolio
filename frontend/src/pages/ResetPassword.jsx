import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.resetPassword(token, password);
      if (!result.success) {
        setError(result.message || 'Unable to reset your password.');
      } else {
        setMessage(result.message);
        setTimeout(() => navigate('/admin/login'), 1200);
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <h1>Reset Password</h1>
        {!token ? (
          <div className="error-message">This reset link is invalid or incomplete.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required disabled={loading} />
            </div>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        )}
        <Link className="text-button" to="/admin/login">Back to login</Link>
      </div>
    </div>
  );
}