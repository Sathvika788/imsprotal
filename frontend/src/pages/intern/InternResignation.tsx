import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, FileText, AlertCircle } from 'lucide-react';

const InternResignation = () => {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const queryClient = useQueryClient();

  const { data: resignations, isLoading } = useQuery({
    queryKey: ['my-resignations'],
    queryFn: async () => {
      const res = await api.get('/resignations/my-resignations');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post('/resignations/submit', {
        reason,
        last_working_day: lastWorkingDay,
        notice_period_days: noticePeriod,
      });
    },
    onSuccess: () => {
      toast.success('Resignation submitted successfully!');
      setShowForm(false);
      setReason('');
      setLastWorkingDay('');
      setNoticePeriod(30);
      queryClient.invalidateQueries({ queryKey: ['my-resignations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit resignation');
    },
  });

  const statusColor = (s: string) =>
    s === 'accepted' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  return (
    <PageShell title="Resignation">
      <div
        style={{
          background: '#fef3c7',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #fbbf24',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'start',
        }}
      >
        <AlertCircle size={20} color="#f59e0b" />
        <div>
          <p style={{ margin: '0 0 4px 0', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}>
            Important Notice
          </p>
          <p style={{ margin: 0, color: '#78350f', fontSize: '13px' }}>
            Submitting a resignation is a serious decision. Please ensure you have discussed this with your manager before proceeding.
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '12px 24px',
          background: '#ef4444',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        {showForm ? 'Cancel' : '📝 Submit Resignation'}
      </button>

      {showForm && (
        <div
          style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #1f2a3c',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Resignation Form</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                  Last Working Day *
                </label>
                <input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0d1b2e',
                    border: '1px solid #1f2a3c',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(parseInt(e.target.value))}
                  min="0"
                  max="90"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0d1b2e',
                    border: '1px solid #1f2a3c',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Reason for Resignation *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide your reason for leaving..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={() => submitMutation.mutate()}
              disabled={!reason || !lastWorkingDay || submitMutation.isPending}
              style={{
                padding: '12px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: !reason || !lastWorkingDay ? 'not-allowed' : 'pointer',
                opacity: !reason || !lastWorkingDay ? 0.5 : 1,
              }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Resignation'}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: '#111827',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #1f2a3c',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Resignations</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : resignations && resignations.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {resignations.map((resignation: any) => (
              <div
                key={resignation.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <Calendar size={16} color="#64748b" />
                      <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
                        Last Working Day: <strong>{resignation.last_working_day}</strong>
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '14px' }}>
                      Notice Period: {resignation.notice_period_days} days
                    </p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Submitted: {new Date(resignation.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '6px 16px',
                      background: statusColor(resignation.status) + '22',
                      color: statusColor(resignation.status),
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {resignation.status}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    background: '#111827',
                    borderRadius: '8px',
                    marginBottom: resignation.review_notes ? '12px' : 0,
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                    Reason:
                  </p>
                  <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
                    {resignation.reason}
                  </p>
                </div>

                {resignation.review_notes && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#111827',
                      borderRadius: '8px',
                      borderLeft: '3px solid #3b82f6',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                      Management Response:
                    </p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
                      {resignation.review_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No resignations submitted
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InternResignation;