
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Mail, KeyRound } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (token && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const endpoint = token ? 'reset-password' : 'forgot-password';

      const body = token
        ? { token, password }
        : { email };

      const response = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed.');
      }

      setMessage(
        data.message ||
          (token
            ? 'Password reset successful.'
            : 'If your account exists, reset instructions will be sent.')
      );

      if (!token) setEmail('');
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="auth-art-inner">
          <span className="eyebrow">SHOPSPHERE SUPPORT</span>
          <h2>
            A fresh
            <br />
            start is <em>close.</em>
          </h2>
          <p>We'll help you get back to the things you love.</p>
          <div className="auth-art-circle">S<span>✳</span></div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <span className="auth-icon">
            <LockKeyhole size={23} />
          </span>

          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h1>{token ? 'Choose a new password' : 'Reset your password'}</h1>

          <p>
            {token
              ? 'Enter your new password below.'
              : 'Enter your email address to receive a secure reset link.'}
          </p>

          {message && <div className="alert success" role="status">{message}</div>}
          {error && <div className="alert error" role="alert">{error}</div>}

          <form onSubmit={submit} className="form-stack">
            {!token ? (
              <label htmlFor="reset-email">
                Email address
                <div className="auth-input-wrap">
                  <Mail size={18} className="auth-field-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
            ) : (
              <>
                <label htmlFor="new-password">
                  New password
                  <div className="auth-input-wrap">
                    <LockKeyhole size={18} className="auth-field-icon" />
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                <label htmlFor="confirm-password">
                  Confirm new password
                  <div className="auth-input-wrap">
                    <LockKeyhole size={18} className="auth-field-icon" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter password again"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </label>
              </>
            )}

            <button
              type="submit"
              className="button button-primary button-full"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : token
                  ? 'Update Password'
                  : 'Send Reset Link'}
              <KeyRound size={17} />
            </button>
          </form>

          <div className="auth-switch">
            <Link to="/login"><ArrowLeft size={15} /> Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}