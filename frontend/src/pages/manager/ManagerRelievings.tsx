import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, User, FileText } from 'lucide-react';

const ManagerRelievings = () => {
  const queryClient = useQueryClient();

  const { data: relievings, isLoading } = useQuery({
    queryKey: ['all-relievings'],
    queryFn: async () => {
      const res = await api.get('/relievings/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      await api.post(`/relievings/${id}/review`, {
        status,
        review_notes: notes,
      });
    },
    onSuccess: () => {
      toast.success('Relieving reviewed successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-relievings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to review relieving');
    },
  });

  const handleReview = (id: string, status: 'accepted' | 'rejected') => {
    const notes = prompt(
      status === 'accepted'
        ? 'Enter acceptance notes (optional):'
        : 'Enter rejection notes (required):'
    );

    if (status === 'rejected' && !notes) {
      toast.error('Rejection notes are required');
      return;
    }

    reviewMutation.mutate({ id, status, notes: notes || '' });
  };

  const statusColor = (s: string) =>
    s === 'accepted' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  const pendingRelievings = relievings?.filter((r: any) => r.status === 'pending') || [];
  const reviewedRelievings = relievings?.filter((r: any) => r.status !== 'pending') || [];

  return (
    <PageShell title="Relieving Management">
      {/* Pending Relievings */}
      <div
        style={{
          background: '#111827',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #1f2a3c',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0' }}>
            Pending Relievings ({pendingRelievings.length})
          </h3>
        </div>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : pendingRelievings.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingRelievings.map((relieving: any) => (
              <div
                key={relieving.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '2px solid #f97316',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User size={16} color="#00d4aa" />
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '18px' }}>
                        {relieving.intern_name}
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px' }}>
                      {relieving.intern_email}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Last Working Day</p>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                          {relieving.last_working_day}
                        </p>
                      </div>

                      <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Notice Period</p>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                          {relieving.notice_period_days} days
                        </p>
                      </div>

                      <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Submitted</p>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                          {new Date(relieving.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px',
                        background: '#111827',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                        Reason:
                      </p>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6' }}>
                        {relieving.reason}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleReview(relieving.id, 'accepted')}
                        disabled={reviewMutation.isPending}
                        style={{
                          padding: '10px 20px',
                          background: '#22c55e',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✓ Accept
                      </button>

                      <button
                        onClick={() => handleReview(relieving.id, 'rejected')}
                        disabled={reviewMutation.isPending}
                        style={{
                          padding: '10px 20px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No pending relievings
            </p>
          </div>
        )}
      </div>

      {/* Reviewed Relievings */}
      <div
        style={{
          background: '#111827',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #1f2a3c',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
          Reviewed Relievings ({reviewedRelievings.length})
        </h3>

        {reviewedRelievings.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {reviewedRelievings.map((relieving: any) => (
              <div
                key={relieving.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '16px' }}>
                        {relieving.intern_name}
                      </h4>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>
                        • {relieving.last_working_day}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {relieving.intern_email}
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

                {relieving.review_notes && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#111827',
                      borderRadius: '8px',
                      marginTop: '12px',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>
                      Review Notes:
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
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No reviewed relievings
          </p>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerRelievings;
