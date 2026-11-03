import React, { useState } from 'react';
import { apiClient } from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/useAuthStore';

export const MfaSettings: React.FC = () => {
  const { user, setAuth, token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const toggleMfa = async () => {
    if (!user || !token) return;
    setLoading(true);

    try {
      const nextState = !user.mfaEnabled;
      await apiClient.post('/v1/auth/mfa/toggle', { enabled: nextState });
      
      setAuth({ ...user, mfaEnabled: nextState }, token);
    } catch (err) {
      console.error('Failed to update MFA state', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-card">
      <h3>Multi-Factor Authentication (MFA)</h3>
      <p>Status: {user?.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
      <button onClick={toggleMfa} disabled={loading}>
        {user?.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
      </button>
    </div>
  );
};