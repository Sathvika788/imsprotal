import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MessageSquare, Shield, AlertTriangle } from 'lucide-react';

const InternComplaints = () => {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work_environment');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => {
      const res = await api.get('/complaints/my-complaints');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post('/complaints/submit', {
        subject,
        description,
        category,
        is_anonymous: isAnonymous,
      });
    },
    onSuccess: () => {
      toast.success('Complaint submitted successfully!');
      setShowForm(false);
      setSubject('');
      setDescription('');
      setCategory('work_environment');
      setIsAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit complaint');
    },
  });

  const statusColor = (s: string) =>
    s === 'resolved' ? '#22c55e' : s === 'in_progress' ? '#3b82f6' : '#f97316';

  const categoryColor = (c: string) => {
    if (c === 'harassment') return '#ef4444';
    if (c === 'work_environment') return '#f59e0b';
    if (c === 'technical') return '#3b82f6';
    return '#64748b';
  };

  const categoryLabel = (c: string) => c.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <PageShell title="Complaint Box">
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
        <Shield size={20} color="#1e40af" />
        <div>
          <p style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontWeight: 'bold', fontSize: '14px' }}>
            Safe & Confidential
          </p>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '13px' }}>
            Your complaints are taken seriously. You can submit anonymously if you prefer. All complaints are reviewed by management.
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
        {showForm ? 'Cancel' : '📢 Submit Complaint'}
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
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Submit Complaint</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your complaint"
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
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              >
                <option value="work_environment">Work Environment</option>
                <option value="harassment">Harassment</option>
                <option value="technical">Technical Issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide detailed information about your complaint..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  minHeight: '150px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="anonymous" style={{ color: '#e2e8f0', fontSize: '14px', cursor: 'pointer' }}>
                Submit anonymously (your identity will not be revealed)
              </label>
            </div>

            <button
              onClick={() => submitMutation.mutate()}
              disabled={!subject || !description || submitMutation.isPending}
              style={{
                padding: '12px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: !subject || !description ? 'not-allowed' : 'pointer',
                opacity: !subject || !description ? 0.5 : 1,
              }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Complaints</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : complaints && complaints.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {complaints.map((complaint: any) => (
              <div
                key={complaint.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '16px' }}>
                        {complaint.subject}
                      </h4>
                      {complaint.is_anonymous && (
                        <span
                          style={{
                            padding: '2px 8px',
                            background: '#64748b22',
                            color: '#94a3b8',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          ANONYMOUS
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: categoryColor(complaint.category) + '22',
                          color: categoryColor(complaint.category),
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {categoryLabel(complaint.category)}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '6px 16px',
                      background: statusColor(complaint.status) + '22',
                      color: statusColor(complaint.status),
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {complaint.status}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    background: '#111827',
                    borderRadius: '8px',
                    marginBottom: complaint.response ? '12px' : 0,
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                    Your Complaint:
                  </p>
                  <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6' }}>
                    {complaint.description}
                  </p>
                </div>

                {complaint.response && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#111827',
                      borderRadius: '8px',
                      borderLeft: '3px solid #22c55e',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
                      Management Response:
                    </p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6' }}>
                      {complaint.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <MessageSquare size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No complaints submitted
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InternComplaints;