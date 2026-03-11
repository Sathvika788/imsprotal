import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Award, FileText, ExternalLink } from 'lucide-react';

const InternKT = () => {
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: kts, isLoading } = useQuery({
    queryKey: ['my-kts'],
    queryFn: async () => {
      const res = await api.get('/kt/my-kts');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('description', description);
      if (document) formData.append('document', document);

      await api.post('/kt/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('KT document submitted successfully!');
      setShowForm(false);
      setTopic('');
      setDescription('');
      setDocument(null);
      queryClient.invalidateQueries({ queryKey: ['my-kts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit KT document');
    },
  });

  const statusColor = (s: string) =>
    s === 'reviewed' ? '#22c55e' : '#f97316';

  const gradeColor = (g: string) => {
    if (['A+', 'A'].includes(g)) return '#22c55e';
    if (['B+', 'B'].includes(g)) return '#3b82f6';
    if ('C' === g) return '#f97316';
    return '#ef4444';
  };

  return (
    <PageShell title="Knowledge Transfer (KT)">
      <div
        style={{
          background: '#dbeafe',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3b82f6',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'start',
        }}
      >
        <BookOpen size={20} color="#1e40af" />
        <div>
          <p style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontWeight: 'bold', fontSize: '14px' }}>
            Knowledge Transfer Documentation
          </p>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '13px' }}>
            Document your learnings, processes, and knowledge gained during your internship. This helps future team members and demonstrates your contributions.
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: '12px 24px',
          background: '#00d4aa',
          border: 'none',
          borderRadius: '8px',
          color: '#0a0e1a',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        {showForm ? 'Cancel' : '📚 Submit New KT Document'}
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
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Submit KT Document</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Topic / Title *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., AWS Lambda Deployment Process, React State Management Best Practices"
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
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of the topic, key learnings, steps, best practices, pitfalls to avoid, etc."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  minHeight: '200px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Supporting Document (PDF/DOC/Images)
              </label>
              <input
                type="file"
                onChange={(e) => setDocument(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,image/*"
                style={{ color: '#64748b' }}
              />
              <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '12px' }}>
                Optional: Include diagrams, screenshots, flowcharts, or detailed documentation
              </p>
            </div>

            <button
              onClick={() => submitMutation.mutate()}
              disabled={!topic || !description || submitMutation.isPending}
              style={{
                padding: '12px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: !topic || !description ? 'not-allowed' : 'pointer',
                opacity: !topic || !description ? 0.5 : 1,
              }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit KT Document'}
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My KT Documents</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : kts && kts.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {kts.map((kt: any) => (
              <div
                key={kt.id}
                style={{
                  padding: '24px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '18px' }}>
                      {kt.topic}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>
                      Submitted: {new Date(kt.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span
                      style={{
                        padding: '6px 16px',
                        background: statusColor(kt.status) + '22',
                        color: statusColor(kt.status),
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    >
                      {kt.status}
                    </span>

                    {kt.grade && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={18} color={gradeColor(kt.grade)} />
                        <span
                          style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: gradeColor(kt.grade),
                          }}
                        >
                          {kt.grade}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    background: '#111827',
                    borderRadius: '8px',
                    marginBottom: kt.document_url || kt.suggestions ? '16px' : 0,
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                    Description:
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
                      marginBottom: kt.suggestions ? '16px' : 0,
                    }}
                  >
                    <FileText size={16} />
                    View Document
                    <ExternalLink size={12} />
                  </a>
                )}

                {kt.suggestions && (
                  <div
                    style={{
                      padding: '16px',
                      background: '#111827',
                      borderRadius: '8px',
                      borderLeft: '3px solid #3b82f6',
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                      Manager's Feedback & Suggestions:
                    </p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7' }}>
                      {kt.suggestions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <BookOpen size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No KT documents submitted yet
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InternKT;