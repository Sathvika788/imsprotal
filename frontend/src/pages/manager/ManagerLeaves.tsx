import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, User, CheckCircle, XCircle } from 'lucide-react';

const ManagerLeaves = () => {
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: async () => {
      const res = await api.get('/leaves/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      await api.post(`/leaves/${id}/review`, { status, review_notes: notes });
    },
    onSuccess: () => {
      toast.success('Leave reviewed!');
      queryClient.invalidateQueries({ queryKey: ['all-leaves'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to review');
    },
  });

  const statusStyle = (s: string) =>
    s === 'approved' ? { color: '#16a34a', bg: '#dcfce7' }
    : s === 'rejected' ? { color: '#dc2626', bg: '#fee2e2' }
    : { color: '#ea580c', bg: '#ffedd5' };

  const typeStyle = (t: string) =>
    t === 'sick' ? { color: '#dc2626', bg: '#fee2e2' }
    : t === 'casual' ? { color: '#2563eb', bg: '#dbeafe' }
    : { color: '#ea580c', bg: '#ffedd5' };

  const pending = leaves?.filter((l: any) => l.status === 'pending') || [];
  const reviewed = leaves?.filter((l: any) => l.status !== 'pending') || [];

  if (isLoading) return (
    <PageShell title="Leave Requests">
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>Loading...</p>
      </div>
    </PageShell>
  );

  return (
    <PageShell title="Leave Requests">
      {pending.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f1623' }}>Pending Approval</h2>
            <span style={{ padding: '2px 10px', background: '#ffedd5', color: '#ea580c', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              {pending.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.map((leave: any) => {
              const ts = typeStyle(leave.leave_type);
              return (
                <div key={leave.id} style={{
                  background: '#fff', borderRadius: '12px', border: '2px solid #fed7aa',
                  boxShadow: '0 2px 8px rgba(234,88,12,0.06)', padding: '22px 24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={18} color="#64748b" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#0f1623' }}>{leave.intern_name}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{leave.intern_email}</p>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: ts.bg, color: ts.color, textTransform: 'uppercase' }}>
                          {leave.leave_type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Calendar size={14} color="#64748b" />
                        <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>{leave.start_date} → {leave.end_date}</span>
                      </div>
                      <div style={{ padding: '12px 14px', background: '#f8f9fc', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                        <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Reason</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>{leave.reason}</p>
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        Requested {new Date(leave.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                      <button
                        onClick={() => reviewMutation.mutate({ id: leave.id, status: 'approved' })}
                        disabled={reviewMutation.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#dcfce7', border: 'none', borderRadius: '8px', color: '#16a34a', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button
                        onClick={() => { const notes = prompt('Rejection reason (optional):'); reviewMutation.mutate({ id: leave.id, status: 'rejected', notes: notes || undefined }); }}
                        disabled={reviewMutation.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#dc2626', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f1623' }}>
            Reviewed ({reviewed.length})
          </h2>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0' }}>
            {reviewed.map((leave: any, i: number) => {
              const ss = statusStyle(leave.status);
              const ts = typeStyle(leave.leave_type);
              return (
                <div key={leave.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px', borderBottom: i < reviewed.length - 1 ? '1px solid #f1f3f8' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1623' }}>{leave.intern_name}</p>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: ts.bg, color: ts.color, textTransform: 'uppercase' }}>
                        {leave.leave_type}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{leave.start_date} → {leave.end_date}</p>
                    {leave.review_notes && (
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>Note: {leave.review_notes}</p>
                    )}
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: ss.bg, color: ss.color, textTransform: 'uppercase' }}>
                    {leave.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leaves?.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>No leave requests yet</p>
        </div>
      )}
    </PageShell>
  );
};

export default ManagerLeaves;