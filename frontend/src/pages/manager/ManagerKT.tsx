import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, User, FileText, ExternalLink } from 'lucide-react';

const ManagerKT = () => {
  const queryClient = useQueryClient();

  const { data: kts, isLoading } = useQuery({
    queryKey: ['all-kts'],
    queryFn: async () => {
      const res = await api.get('/kt/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, grade, suggestions }: { id: string; grade: string; suggestions: string }) => {
      await api.post(`/kt/${id}/review`, {
        grade,
        suggestions,
      });
    },
    onSuccess: () => {
      toast.success('KT document reviewed successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-kts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to review KT document');
    },
  });

  const handleReview = (id: string) => {
    const grade = prompt('Enter grade (A+, A, B+, B, C, D, F):');
    if (!grade || !['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].includes(grade.toUpperCase())) {
      toast.error('Invalid grade. Please enter A+, A, B+, B, C, D, or F');
      return;
    }

    const suggestions = prompt('Enter your suggestions and feedback:');
    if (!suggestions) {
      toast.error('Suggestions cannot be empty');
      return;
    }

    reviewMutation.mutate({ id, grade: grade.toUpperCase(), suggestions });
  };

  const statusColor = (s: string) =>
    s === 'reviewed' ? '#22c55e' : '#f97316';

  const gradeColor = (g: string) => {
    if (['A+', 'A'].includes(g)) return '#22c55e';
    if (['B+', 'B'].includes(g)) return '#3b82f6';
    if ('C' === g) return '#f97316';
    return '#ef4444';
  };

  const pendingKTs = kts?.filter((kt: any) => kt.status === 'pending') || [];
  const reviewedKTs = kts?.filter((kt: any) => kt.status === 'reviewed') || [];

  return (
    <PageShell title="Knowledge Transfer Review">
      {/* Pending KTs */}
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
          📚 Pending Review ({pendingKTs.length})
        </h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : pendingKTs.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {pendingKTs.map((kt: any) => (
              <div
                key={kt.id}
                style={{
                  padding: '24px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '2px solid #f97316',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <User size={16} color="#00d4aa" />
                      <h4 style={{ margin: 0, color: '#00d4aa', fontSize: '16px', fontWeight: 'bold' }}>
                        {kt.intern_name}
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>
                      {kt.intern_email}
                    </p>

                    <h3 style={{ margin: '0 0 12px 0', color: '#e2e8f0', fontSize: '20px' }}>
                      {kt.topic}
                    </h3>

                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>
                      📅 Submitted: {new Date(kt.created_at).toLocaleDateString()}
                    </p>

                    <div
                      style={{
                        padding: '16px',
                        background: '#111827',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                        Knowledge Transfer Content:
                      </p>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                        {kt.description}
                      </p>
                    </div>

                    {kt.document_url && (
                      <a
                        href={kt.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          background: '#1f2a3c',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          textDecoration: 'none',
                          fontSize: '13px',
                          marginBottom: '16px',
                        }}
                      >
                        <FileText size={16} />
                        View Supporting Document
                        <ExternalLink size={12} />
                      </a>
                    )}

                    <div style={{ marginTop: '16px' }}>
                      <button
                        onClick={() => handleReview(kt.id)}
                        disabled={reviewMutation.isPending}
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
                        ✍️ Review & Grade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <BookOpen size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No pending KT documents to review
            </p>
          </div>
        )}
      </div>

      {/* Reviewed KTs */}
      <div
        style={{
          background: '#111827',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #1f2a3c',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
          ✅ Reviewed ({reviewedKTs.length})
        </h3>

        {reviewedKTs.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {reviewedKTs.map((kt: any) => (
              <div
                key={kt.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #22c55e44',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '16px' }}>
                        {kt.topic}
                      </h4>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: gradeColor(kt.grade) + '22',
                          color: gradeColor(kt.grade),
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                        }}
                      >
                        Grade: {kt.grade}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {kt.intern_name} • {new Date(kt.reviewed_at || kt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No reviewed KT documents yet
          </p>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerKT;