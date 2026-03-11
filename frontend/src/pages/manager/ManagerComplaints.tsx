import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MessageSquare, AlertTriangle, Shield } from 'lucide-react';

const ManagerComplaints = () => {
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['all-complaints'],
    queryFn: async () => {
      const res = await api.get('/complaints/all');
      return res.data;
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response, status }: { id: string; response: string; status: string }) => {
      await api.post(`/complaints/${id}/respond`, {
        response,
        status,
      });
    },
    onSuccess: () => {
      toast.success('Response sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-complaints'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send response');
    },
  });

  const handleRespond = (id: string) => {
    const response = prompt('Enter your response:');
    if (!response) {
      toast.error('Response cannot be empty');
      return;
    }

    const status = window.confirm('Mark as resolved?') ? 'resolved' : 'in_progress';
    respondMutation.mutate({ id, response, status });
  };

  const statusColor = (s: string) =>
    s === 'resolved' ? '#22c55e' : s === 'in_progress' ? '#3b82f6' : '#f97316';

  const categoryColor = (c: string) => {
    if (c === 'harassment') return '#ef4444';
    if (c === 'work_environment') return '#f59e0b';
    if (c === 'technical') return '#3b82f6';
    return '#64748b';
  };

  const categoryLabel = (c: string) => c.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const pendingComplaints = complaints?.filter((c: any) => c.status === 'pending') || [];
  const inProgressComplaints = complaints?.filter((c: any) => c.status === 'in_progress') || [];
  const resolvedComplaints = complaints?.filter((c: any) => c.status === 'resolved') || [];

  return (
    <PageShell title="Complaint Management">
      {/* Pending Complaints */}
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
            🔴 Pending Complaints ({pendingComplaints.length})
          </h3>
        </div>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : pendingComplaints.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingComplaints.map((complaint: any) => (
              <div
                key={complaint.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '2px solid #ef4444',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '18px' }}>
                        {complaint.subject}
                      </h4>
                      {complaint.is_anonymous && (
                        <span
                          style={{
                            padding: '4px 8px',
                            background: '#64748b22',
                            color: '#94a3b8',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          🔒 ANONYMOUS
                        </span>
                      )}
                    </div>

                    {!complaint.is_anonymous && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 4px 0', color: '#00d4aa', fontSize: '14px', fontWeight: 'bold' }}>
                          {complaint.intern_name}
                        </p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                          {complaint.intern_email}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <span
                        style={{
                          padding: '6px 12px',
                          background: categoryColor(complaint.category) + '22',
                          color: categoryColor(complaint.category),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {categoryLabel(complaint.category)}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                        📅 {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '16px',
                        background: '#111827',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        borderLeft: complaint.category === 'harassment' ? '4px solid #ef4444' : 'none',
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                        Complaint Details:
                      </p>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7' }}>
                        {complaint.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRespond(complaint.id)}
                      disabled={respondMutation.isPending}
                      style={{
                        padding: '12px 24px',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      💬 Respond to Complaint
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Shield size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No pending complaints
            </p>
          </div>
        )}
      </div>

      {/* In Progress Complaints */}
      {inProgressComplaints.length > 0 && (
        <div
          style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #1f2a3c',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
            🔵 In Progress ({inProgressComplaints.length})
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {inProgressComplaints.map((complaint: any) => (
              <div
                key={complaint.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #3b82f6',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '16px' }}>
                        {complaint.subject}
                      </h4>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: categoryColor(complaint.category) + '22',
                          color: categoryColor(complaint.category),
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {categoryLabel(complaint.category)}
                      </span>
                    </div>

                    {!complaint.is_anonymous && (
                      <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>
                        {complaint.intern_name} • {complaint.intern_email}
                      </p>
                    )}

                    {complaint.response && (
                      <div
                        style={{
                          padding: '12px',
                          background: '#111827',
                          borderRadius: '8px',
                          marginTop: '12px',
                        }}
                      >
                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>
                          Your Response:
                        </p>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
                          {complaint.response}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleRespond(complaint.id)}
                      disabled={respondMutation.isPending}
                      style={{
                        padding: '10px 20px',
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '12px',
                      }}
                    >
                      ✓ Mark as Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Complaints */}
      <div
        style={{
          background: '#111827',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #1f2a3c',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
          ✅ Resolved Complaints ({resolvedComplaints.length})
        </h3>

        {resolvedComplaints.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {resolvedComplaints.map((complaint: any) => (
              <div
                key={complaint.id}
                style={{
                  padding: '16px',
                  background: '#0d1b2e',
                  borderRadius: '8px',
                  border: '1px solid #22c55e44',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '15px' }}>
                      {complaint.subject}
                    </h4>
                    {!complaint.is_anonymous && (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                        {complaint.intern_name}
                      </p>
                    )}
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {new Date(complaint.responded_at || complaint.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No resolved complaints
          </p>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerComplaints;