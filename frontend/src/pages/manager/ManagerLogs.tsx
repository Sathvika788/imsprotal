import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ManagerLogs = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ['logs-by-date', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/logs/date/${selectedDate}`);
      return res.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ logId, status, comment }: { logId: string; status: string; comment?: string }) => {
      await api.post(`/logs/${logId}/verify`, { status, comment });
    },
    onSuccess: () => {
      toast.success('Log updated!');
      queryClient.invalidateQueries({ queryKey: ['logs-by-date'] });
    },
  });

  return (
    <PageShell title="Verify Logs">
      <div style={{ marginBottom: '24px' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: '12px', background: '#111827', border: '1px solid #1f2a3c', borderRadius: '8px', color: '#e2e8f0' }}
        />
      </div>

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        {logs && logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map((log: any) => (
              <div key={log.id} style={{ padding: '20px', background: '#0d1b2e', borderRadius: '8px', border: '1px solid #1f2a3c' }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>{log.intern_name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{log.intern_email}</p>
                </div>
                <p style={{ margin: '12px 0', color: '#e2e8f0' }}>{log.content}</p>
                {log.proof_url && (
                  <a href={log.proof_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '14px' }}>
                    View Proof →
                  </a>
                )}
                {log.status === 'pending' && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => verifyMutation.mutate({ logId: log.id, status: 'verified' })}
                      style={{ padding: '8px 16px', background: '#22c55e', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => {
                        const comment = prompt('Rejection reason:');
                        if (comment) verifyMutation.mutate({ logId: log.id, status: 'rejected', comment });
                      }}
                      style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {log.status !== 'pending' && (
                  <p style={{ marginTop: '12px', color: log.status === 'verified' ? '#22c55e' : '#ef4444', fontSize: '14px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    {log.status}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No logs for this date</p>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerLogs;
