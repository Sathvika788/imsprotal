import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, FileText, AlertCircle } from 'lucide-react';

const InternRelieving = () => {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const queryClient = useQueryClient();

  const { data: relievings, isLoading } = useQuery({
    queryKey: ['my-relievings'],
    queryFn: async () => {
      const res = await api.get('/relievings/my-relievings');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post('/relievings/submit', {
        reason,
        last_working_day: lastWorkingDay,
        notice_period_days: noticePeriod,
      });
    },
    onSuccess: () => {
      toast.success('Relieving submitted successfully!');
      setShowForm(false);
      setReason('');
      setLastWorkingDay('');
      setNoticePeriod(30);
      queryClient.invalidateQueries({ queryKey: ['my-relievings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit relieving');
    },
  });

  const statusColor = (s: string) =>
    s === 'accepted' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  return (
    <PageShell title="Relieving">
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
            Submitting a relieving request is a serious decision. Please ensure you have discussed this with your manager before proceeding.
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
        {showForm ? 'Cancel' : '📝 Submit Relieving'}
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
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Relieving Form</h3>

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
                Reason for Relieving *
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
              {submitMutation.isPending ? 'Submitting...' : 'Submit Relieving'}
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Relievings</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : relievings && relievings.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {relievings.map((relieving: any) => (
              <div
                key={relieving.id}
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
                        Last Working Day: <strong>{relieving.last_working_day}</strong>
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '14px' }}>
                      Notice Period: {relieving.notice_period_days} days
                    </p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Submitted: {new Date(relieving.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '6px 16px',
                      background: statusColor(relieving.status) + '22',
                      color: statusColor(relieving.status),
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {relieving.status}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    background: '#111827',
                    borderRadius: '8px',
                    marginBottom: relieving.review_notes ? '12px' : 0,
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                    Reason:
                  </p>
                  <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
                    {relieving.reason}
                  </p>
                </div>

                {relieving.review_notes && (
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
                      {relieving.review_notes}
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
              No relievings submitted
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InternRelieving;
