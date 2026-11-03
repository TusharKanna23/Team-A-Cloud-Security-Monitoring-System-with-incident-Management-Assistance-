import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/useAuthStore';

export const LoginForm: React.FC = () => {
  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerActive, timeLeft]);

  const startCountdown = () => {
    setTimeLeft(60);
    setIsTimerActive(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post('/v1/auth/login', { email, password });
      if (response.data.otpRequired) {
        setStep('OTP');
        setInfoMessage('Verification code dispatched. Check backend terminal for code.');
        startCountdown();
      }
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/v1/auth/verify-otp', { email, otpCode });
      setAuth(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive) return;
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post('/v1/auth/resend-otp', { email });
      setInfoMessage(response.data.message || 'New OTP code sent successfully.');
      setOtpCode('');
      startCountdown();
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to resend OTP.');
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
            <span style={styles.badgeText}>SkyShield SOC v3.2</span>
          </div>
          <div style={styles.iconWrapper}>
            <svg width="28" height="32" viewBox="0 0 24 28" fill="none">
              <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z" fill="#2563EB" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 8V16M8 12H16" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={styles.title}>Access Portal</h2>
          <p style={styles.subtitle}>
            {step === 'LOGIN' ? 'Authenticate your cloud security identity' : 'Enter 6-digit email verification code'}
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {infoMessage && <div style={styles.infoBox}>{infoMessage}</div>}

        {step === 'LOGIN' ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Work Email</label>
              <input
                type="email"
                placeholder="analyst@skyshield.io"
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

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Two-Factor Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                style={styles.otpInput}
              />
            </div>

            <div style={styles.timerRow}>
              <span style={styles.timerText}>
                {timeLeft > 0 ? (
                  `Code expires in ${timeLeft}s`
                ) : (
                  <span style={{ color: '#F87171' }}>Code expired</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isTimerActive || loading}
                style={isTimerActive ? styles.resendDisabledBtn : styles.resendActiveBtn}
              >
                Resend Code
              </button>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : 'Verify & Launch Console'}
            </button>

            <button
              type="button"
              onClick={() => setStep('LOGIN')}
              style={styles.secondaryBtn}
            >
              Back to Credentials
            </button>
          </form>
        )}

        <div style={styles.footer}>
          New Security Analyst?{' '}
          <Link to="/register" style={styles.link}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090D16',
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.15), transparent 50%), radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.08), transparent 40%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
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
    marginBottom: '28px',
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
    marginBottom: '16px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px #10B981',
  },
  badgeText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '16px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
  },
  title: {
    margin: '0 0 6px 0',
    color: '#F8FAFC',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: 0,
    color: '#94A3B8',
    fontSize: '13px',
    lineHeight: '1.5',
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
  infoBox: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#93C5FD',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
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
    padding: '12px 16px',
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
    padding: '12px 42px 12px 16px',
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
  otpInput: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid #3B82F6',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '10px',
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)',
  },
  timerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  resendActiveBtn: {
    backgroundColor: 'transparent',
    color: '#60A5FA',
    border: 'none',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  resendDisabledBtn: {
    backgroundColor: 'transparent',
    color: '#475569',
    border: 'none',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'not-allowed',
    padding: 0,
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
  secondaryBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '28px',
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