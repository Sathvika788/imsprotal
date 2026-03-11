import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Home, User, Calendar } from 'lucide-react';

const ManagerWFH = () => {
  const queryClient = useQueryClient();

  const { data: wfhRequests, isLoading } = useQuery({
    queryKey: ['all-wfh'],
    queryFn: async () => {
      const res = await api.get('/wfh/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.post(`/wfh/${id}/review`, { status });
    },
    onSuccess: () => {
      toast.success('WFH request reviewed!');
      queryClient.invalidateQueries({ queryKey: ['all-wfh'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to review WFH request');
    },
  });

  const statusColor = (s: string) =>
    s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  const cardStyle = {
    background: '#111827',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #1f2a3c',
  };

  // Filter by status
  const pendingRequests = wfhRequests?.filter((w: any) => w.status === 'pending') || [];
  const reviewedRequests = wfhRequests?.filter((w: any) => w.status !== 'pending') || [];

  return (
    <PageShell title="Work From Home Requests">
      {isLoading ? (
        <div style={cardStyle}>
          <p style={{ color: '#64748b' }}>Loading WFH requests...</p>
        </div>
      ) : (
        <>
          {/* Pending WFH Requests */}
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#f9731622',
                    color: '#f97316',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {pendingRequests.length}
                </span>
                Pending Approvals
              </h2>

              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingRequests.map((wfh: any) => (
                  <div
                    key={wfh.id}
                    style={{
                      ...cardStyle,
                      border: '2px solid #f97316',
                      boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      {/* Left side - Intern info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#00d4aa22',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <User size={20} color="#00d4aa" />
                          </div>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '18px' }}>
                              {wfh.intern_name}
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                              {wfh.intern_email}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '16px',
                            padding: '12px',
                            background: '#0d1b2e',
                            borderRadius: '8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: '#3b82f622',
                            }}
                          >
                            <Home size={20} color="#3b82f6" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>
                              WFH Date
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} color="#3b82f6" />
                              <span style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                                {new Date(wfh.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#0d1b2e',
                            borderRadius: '8px',
                            borderLeft: '3px solid #3b82f6',
                          }}
                        >
                          <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Reason:</p>
                          <p style={{ margin: 0, color: '#e2e8f0', fontSize: '15px' }}>{wfh.reason}</p>
                        </div>

                        <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                          Requested: {new Date(wfh.created_at).toLocaleString()}
                        </p>
                      </div>

                      {/* Right side - Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                        <button
                          onClick={() => reviewMutation.mutate({ id: wfh.id, status: 'approved' })}
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
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => reviewMutation.mutate({ id: wfh.id, status: 'rejected' })}
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
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewed WFH Requests */}
          {reviewedRequests.length > 0 && (
            <div>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#e2e8f0' }}>
                Reviewed Requests ({reviewedRequests.length})
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {reviewedRequests.map((wfh: any) => (
                  <div
                    key={wfh.id}
                    style={{
                      padding: '16px',
                      background: '#111827',
                      borderRadius: '8px',
                      border: '1px solid #1f2a3c',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#00d4aa22',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <User size={16} color="#00d4aa" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '15px' }}>
                          {wfh.intern_name}
                        </h4>
                        <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>
                          {wfh.intern_email}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        background: '#0d1b2e',
                        borderRadius: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      <Calendar size={14} color="#3b82f6" />
                      <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{wfh.date}</span>
                    </div>

                    <p
                      style={{
                        margin: '0 0 12px 0',
                        padding: '8px',
                        background: '#0d1b2e',
                        borderRadius: '6px',
                        color: '#64748b',
                        fontSize: '13px',
                        lineHeight: '1.4',
                      }}
                    >
                      {wfh.reason}
                    </p>

                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: statusColor(wfh.status) + '22',
                        color: statusColor(wfh.status),
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    >
                      {wfh.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {wfhRequests?.length === 0 && (
            <div style={cardStyle}>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Home size={48} color="#64748b" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>No WFH requests yet</p>
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
};

export default ManagerWFH;