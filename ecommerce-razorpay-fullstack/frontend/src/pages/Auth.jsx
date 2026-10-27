
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }

      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-art">
        <div className="auth-art-inner">
          <span className="eyebrow">A BETTER KIND OF SHOPPING</span>

          <h2>
            Good things
            <br />
            are <em>closer</em>
            <br />
            than you think.
          </h2>

          <p>Thoughtful essentials for the life you're living.</p>

          <div className="auth-art-circle">
            S<span>✳</span>
          </div>
        </div>
      </div>

      {/* Right authentication panel */}
      <div className="auth-panel">
        <div className="auth-card">
          <span className="auth-icon">
            <LockKeyhole size={23} />
          </span>

          <span className="eyebrow">
            {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
          </span>

          <h1>
            {isRegister
              ? 'Create your account'
              : 'Sign in to ShopSphere'}
          </h1>

          <p>
            {isRegister
              ? 'Join us for a more thoughtful everyday.'
              : 'Your next favourite thing is waiting.'}
          </p>

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="form-stack">
            {isRegister && (
              <label htmlFor="auth-name">
                Full name
                <div className="auth-input-wrap">
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    minLength={2}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}

            <label htmlFor="auth-email">
              Email address
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-field-icon" />

                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label htmlFor="auth-password">
              Password
              <div className="auth-input-wrap">
                <LockKeyhole
                  size={18}
                  className="auth-field-icon"
                />

                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isRegister
                      ? 'At least 8 characters'
                      : 'Your password'
                  }
                  minLength={isRegister ? 8 : 1}
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {!isRegister && (
              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/reset-password"
                  className="auth-forgot-link"
                >
                  <KeyRound size={16} />
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="button button-primary button-full"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}

              <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-switch">
            {isRegister
              ? 'Already have an account?'
              : 'New to ShopSphere?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create account'}
            </Link>
          </div>

          <small className="form-note">
            Demo project · Never reuse your real banking password.
          </small>
        </div>
      </div>
    </div>
  );
}
