import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/axios';
import type { SessionInfo } from '../../types/auth.types';

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const fetchSessions = async (): Promise<SessionInfo[] | null> => {
    try {
      const res = await apiClient.get('/v1/auth/sessions');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch active sessions', err);
      return null;
    }
  };

  const revokeAllSessions = async () => {
    try {
      await apiClient.post('/v1/auth/sessions/revoke-all');
      const updatedSessions = await fetchSessions();
      if (updatedSessions) setSessions(updatedSessions);
    } catch (err) {
      console.error('Failed to revoke sessions', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetchSessions().then((loadedSessions) => {
      if (!cancelled && loadedSessions) setSessions(loadedSessions);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="session-manager">
      <h3>Active Sessions</h3>
      <button onClick={revokeAllSessions}>Revoke All Other Sessions</button>
      <ul>
        {sessions.map((s) => (
          <li key={s.sessionId}>
            <span>{s.userAgent} - {s.ipAddress}</span>
            {s.isCurrent && <strong> (Current)</strong>}
          </li>
        ))}
      </ul>
    </div>
  );
};