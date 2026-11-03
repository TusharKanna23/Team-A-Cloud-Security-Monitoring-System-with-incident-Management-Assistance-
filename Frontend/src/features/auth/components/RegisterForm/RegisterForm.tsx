import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/useAuthStore';

export const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('ANALYST');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = new RegExp('[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>/?]').test(password);

  const validatePassword = (): string | null => {
    const missing: string[] = [];
    if (!hasMinLength) missing.push('at least 8 characters');
    if (!hasUppercase) missing.push('one uppercase letter (A-Z)');
    if (!hasNumber) missing.push('one number (0-9)');
    if (!hasSymbol) missing.push('one special symbol (!@#$%^&*)');

    if (missing.length > 0) {
      return `Password missing: ${missing.join(', ')}.`;
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/v1/auth/register', {
        fullName,
        email,
        password,
        confirmPassword,
        role,
      });

      setAuth(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badgeRow}>
            <span style={styles.statusDot}></span>
            <span style={styles.badgeText}>Registration Console</span>
          </div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Register your identity for SkyShield SOC Platform</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Sarah Connor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Work Email</label>
            <input
              type="email"
              placeholder="s.connor@skyshield.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {password.length > 0 && (
            <div style={styles.requirementsBox}>
              <div style={hasMinLength ? styles.reqValid : styles.reqInvalid}>
                {hasMinLength ? '✓' : '•'} Min 8 characters
              </div>
              <div style={hasUppercase ? styles.reqValid : styles.reqInvalid}>
                {hasUppercase ? '✓' : '•'} 1 Uppercase (A-Z)
              </div>
              <div style={hasNumber ? styles.reqValid : styles.reqInvalid}>
                {hasNumber ? '✓' : '•'} 1 Number (0-9)
              </div>
              <div style={hasSymbol ? styles.reqValid : styles.reqInvalid}>
                {hasSymbol ? '✓' : '•'} 1 Symbol (!@#$)
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Re-enter Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeBtn}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Access Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="ANALYST">Security Analyst</option>
              <option value="ADMIN">System Administrator</option>
              <option value="VIEWER">Read-Only Viewer</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          Already registered?{' '}
          <Link to="/login" style={styles.link}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090D16',
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.15), transparent 50%), radial-gradient(circle at 0% 100%, rgba(6, 182, 212, 0.08), transparent 40%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '20px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    marginBottom: '12px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3B82F6',
  },
  badgeText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 0 6px 0',
    color: '#F8FAFC',
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    margin: 0,
    color: '#94A3B8',
    fontSize: '13px',
  },
  errorBox: {
    backgroundColor: 'rgba(153, 27, 27, 0.25)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#FCA5A5',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#CBD5E1',
    fontSize: '13px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '11px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    width: '100%',
    padding: '11px 42px 11px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    width: '100%',
    padding: '11px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  requirementsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  reqValid: {
    color: '#34D399',
    fontSize: '11px',
    fontWeight: '600',
  },
  reqInvalid: {
    color: '#64748B',
    fontSize: '11px',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563EB',
    backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
    marginTop: '6px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
  },
  link: {
    color: '#60A5FA',
    textDecoration: 'none',
    fontWeight: '600',
  },
};