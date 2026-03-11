import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

const statusStyle = (status: string) => {
  if (status === 'approved') return { color: '#16a34a', bg: '#dcfce7' };
  if (status === 'rejected') return { color: '#dc2626', bg: '#fee2e2' };
  return { color: '#ea580c', bg: '#ffedd5' };
};

const ManagerExpenses = () => {
  const queryClient = useQueryClient();

  const { data: expenses } = useQuery({
    queryKey: ['all-expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      await api.post(`/expenses/${id}/review`, { status, review_notes: notes });
    },
    onSuccess: () => {
      toast.success('Expense reviewed!');
      queryClient.invalidateQueries({ queryKey: ['all-expenses'] });
    },
  });

  const pending = expenses?.filter((e: any) => e.status === 'pending') || [];
  const reviewed = expenses?.filter((e: any) => e.status !== 'pending') || [];

  return (
    <PageShell title="Review Expenses">
      {pending.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f1623' }}>Pending Review</h2>
            <span style={{ padding: '2px 10px', background: '#ffedd5', color: '#ea580c', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              {pending.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.map((exp: any) => (
              <div key={exp.id} style={{
                background: '#fff', borderRadius: '12px',
                border: '2px solid #fed7aa', padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(234,88,12,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#0f1623' }}>{exp.intern_name}</p>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>{exp.description} · {exp.date}</p>
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#6366f1', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                        <ExternalLink size={13} /> View Receipt
                      </a>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: '#0f1623' }}>₹{exp.amount}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => reviewMutation.mutate({ id: exp.id, status: 'approved' })}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#dcfce7', border: 'none', borderRadius: '7px', color: '#16a34a', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button onClick={() => { const notes = prompt('Rejection reason:'); if (notes) reviewMutation.mutate({ id: exp.id, status: 'rejected', notes }); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fee2e2', border: 'none', borderRadius: '7px', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f1623' }}>
            Reviewed ({reviewed.length})
          </h2>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', overflow: 'hidden' }}>
            {reviewed.map((exp: any, i: number) => {
              const s = statusStyle(exp.status);
              return (
                <div key={exp.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 24px', borderBottom: i < reviewed.length - 1 ? '1px solid #f1f3f8' : 'none',
                }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: '#0f1623' }}>{exp.intern_name}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{exp.description} · {exp.date}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f1623' }}>₹{exp.amount}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color, textTransform: 'uppercase' }}>
                      {exp.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!expenses?.length && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>No expense claims yet</p>
        </div>
      )}
    </PageShell>
  );
};

export default ManagerExpenses;