import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const Dashboard: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(2);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  const handleToggleMfa = () => {
    const newState = !mfaEnabled;
    setMfaEnabled(newState);
    showNotification(`Multi-Factor Authentication (MFA) set to ${newState ? 'ACTIVE' : 'INACTIVE'}.`);
  };

  const handleRevokeSessions = () => {
    setSessionCount(1);
    showNotification('All secondary device sessions revoked.');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.brandIcon}>
            <svg width="22" height="24" viewBox="0 0 24 28" fill="none">
              <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z" fill="#3B82F6" fillOpacity="0.25" stroke="#3B82F6" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.brandTitle}>SkyShield</h1>
            <span style={styles.brandSubtitle}>Security Operations Platform</span>
          </div>
        </div>

        <div style={styles.navUserSection}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.email?.split('@')[0] || 'Security Analyst'}</span>
            <span style={styles.userEmail}>{user?.email || 'analyst@skyshield.io'}</span>
          </div>
          <span style={styles.roleBadge}>{user?.role || 'ANALYST'}</span>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        {notification && <div style={styles.toastNotification}>{notification}</div>}

        <section style={styles.welcomeBanner}>
          <div>
            <h2 style={styles.welcomeHeading}>Operations Overview</h2>
            <p style={styles.welcomeSub}>
              Active session state, authentication policies, and threat logging.
            </p>
          </div>
          <div style={styles.systemStatusPill}>
            <span style={styles.statusDot}></span> Platform Nominal
          </div>
        </section>

        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricIconBg}>🛡️</div>
            <div style={styles.metricDetails}>
              <span style={styles.metricLabel}>MFA Enforcement</span>
              <span style={mfaEnabled ? styles.metricValueSuccess : styles.metricValueWarning}>
                {mfaEnabled ? 'Verified' : 'Disabled'}
              </span>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIconBg}>💻</div>
            <div style={styles.metricDetails}>
              <span style={styles.metricLabel}>Active Sessions</span>
              <span style={styles.metricValue}>{sessionCount} Devices</span>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIconBg}>⚡</div>
            <div style={styles.metricDetails}>
              <span style={styles.metricLabel}>Threat Level</span>
              <span style={styles.metricValueSuccess}>Minimal</span>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIconBg}>🔑</div>
            <div style={styles.metricDetails}>
              <span style={styles.metricLabel}>JWT Claims</span>
              <span style={styles.metricValue}>HMAC-SHA256</span>
            </div>
          </div>
        </div>

        <div style={styles.controlsGrid}>
          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Two-Factor Security Policy</h3>
              <p style={styles.panelDescription}>
                Requires an email verification code for every session instantiation.
              </p>
            </div>
            <div style={styles.panelActionRow}>
              <span style={styles.statusDisplay}>
                Policy: <strong style={{ color: mfaEnabled ? '#34D399' : '#F87171' }}>{mfaEnabled ? 'Enforced' : 'Relaxed'}</strong>
              </span>
              <button
                onClick={handleToggleMfa}
                style={mfaEnabled ? styles.secondaryBtn : styles.primaryBtn}
              >
                {mfaEnabled ? 'Disable Policy' : 'Enforce Policy'}
              </button>
            </div>
          </div>

          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Session Lifecycle Control</h3>
              <p style={styles.panelDescription}>
                Terminate active refresh tokens across secondary browser instances.
              </p>
            </div>
            <div style={styles.panelActionRow}>
              <span style={styles.statusDisplay}>
                Connected: <strong>{sessionCount} Session(s)</strong>
              </span>
              <button
                onClick={handleRevokeSessions}
                disabled={sessionCount <= 1}
                style={sessionCount > 1 ? styles.dangerBtn : styles.disabledBtn}
              >
                Revoke Secondary
              </button>
            </div>
          </div>
        </div>

        <section style={styles.auditSection}>
          <h3 style={styles.panelTitle}>Security Events Feed</h3>
          <div style={styles.auditList}>
            <div style={styles.auditItem}>
              <span style={styles.auditTime}>Just now</span>
              <span style={styles.auditText}>Bearer token validated via Spring Security context filter</span>
              <span style={styles.auditBadgeSuccess}>PASS</span>
            </div>
            <div style={styles.auditItem}>
              <span style={styles.auditTime}>2 mins ago</span>
              <span style={styles.auditText}>Two-factor verification OTP verified successfully</span>
              <span style={styles.auditBadgeInfo}>INFO</span>
            </div>
            <div style={styles.auditItem}>
              <span style={styles.auditTime}>10 mins ago</span>
              <span style={styles.auditText}>H2 database connection pool instantiated</span>
              <span style={styles.auditBadgeInfo}>INFO</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#090D16',
    color: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 36px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  brandTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  navUserSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  userEmail: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#60A5FA',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#CBD5E1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '36px 24px',
  },
  toastNotification: {
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#93C5FD',
    padding: '12px 20px',
    borderRadius: '10px',
    marginBottom: '28px',
    fontSize: '13px',
  },
  welcomeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  welcomeHeading: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: '700',
  },
  welcomeSub: {
    margin: 0,
    color: '#94A3B8',
    fontSize: '13px',
  },
  systemStatusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    color: '#34D399',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(52, 211, 153, 0.3)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#10B981',
    borderRadius: '50%',
    boxShadow: '0 0 8px #10B981',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  metricCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  metricIconBg: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  metricDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metricValueSuccess: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#34D399',
  },
  metricValueWarning: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F87171',
  },
  controlsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  controlPanel: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  panelHeader: {
    marginBottom: '20px',
  },
  panelTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#F8FAFC',
  },
  panelDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#94A3B8',
    lineHeight: '1.5',
  },
  panelActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  statusDisplay: {
    fontSize: '13px',
    color: '#CBD5E1',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#CBD5E1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dangerBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#475569',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  auditSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
  },
  auditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '16px',
  },
  auditItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    fontSize: '13px',
  },
  auditTime: {
    color: '#64748B',
    width: '100px',
  },
  auditText: {
    flex: 1,
    color: '#CBD5E1',
  },
  auditBadgeSuccess: {
    backgroundColor: 'rgba(6, 95, 70, 0.4)',
    color: '#34D399',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '700',
  },
  auditBadgeInfo: {
    backgroundColor: 'rgba(30, 64, 175, 0.4)',
    color: '#60A5FA',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '700',
  },
};