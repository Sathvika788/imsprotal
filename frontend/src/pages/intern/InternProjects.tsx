import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Github, FileText, Calendar, Award, ExternalLink, Plus, X } from 'lucide-react';

const InternProjects = () => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState('AWS');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [githubLink, setGithubLink] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await api.get('/projects/my-projects');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('track', track);
      formData.append('month', month);
      if (githubLink) formData.append('github_link', githubLink);
      if (document) formData.append('document', document);
      await api.post('/projects/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Project submitted successfully!');
      setShowForm(false);
      setName('');
      setDescription('');
      setGithubLink('');
      setDocument(null);
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit project');
    },
  });

  // ── Design tokens ──────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#f8f9fc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    color: '#0f172a',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, { color: string; bg: string }> = {
      approved: { color: '#16a34a', bg: '#dcfce7' },
      rejected: { color: '#dc2626', bg: '#fee2e2' },
      pending:  { color: '#ea580c', bg: '#ffedd5' },
    };
    const c = map[s] || { color: '#64748b', bg: '#f1f5f9' };
    return {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      color: c.color,
      background: c.bg,
    };
  };

  const trackStyle = (t: string): React.CSSProperties => {
    const isAWS = t === 'AWS';
    return {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      color: isAWS ? '#b45309' : '#7c3aed',
      background: isAWS ? '#fef3c7' : '#ede9fe',
    };
  };

  const gradeStyle = (g: string): React.CSSProperties => {
    const color =
      ['A+', 'A'].includes(g) ? '#16a34a' :
      ['B+', 'B'].includes(g) ? '#2563eb' :
      g === 'C' ? '#ea580c' : '#dc2626';
    return { fontSize: '22px', fontWeight: '800', color, fontFamily: "'Plus Jakarta Sans', sans-serif" };
  };

  const gradeIconColor = (g: string) =>
    ['A+', 'A'].includes(g) ? '#16a34a' :
    ['B+', 'B'].includes(g) ? '#2563eb' :
    g === 'C' ? '#ea580c' : '#dc2626';

  // ── Render ─────────────────────────────────────────────────────
  return (
    <PageShell title="My Projects">

      {/* Submit button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: showForm ? '#fee2e2' : '#06b6d4',
            border: 'none',
            borderRadius: '8px',
            color: showForm ? '#dc2626' : '#fff',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.18s',
          }}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Submit New Project</>}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div style={{
          background: '#ffffff',
          padding: '28px',
          borderRadius: '14px',
          border: '1.5px solid #e0f2fe',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(6,182,212,0.08)',
        }}>
          <h3 style={{ margin: '0 0 22px', fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Submit Project
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>

            {/* Project name */}
            <div>
              <label style={labelStyle}>Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AWS Lambda Function for Email Automation"
                style={inputStyle}
              />
            </div>

            {/* Track + Month */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Track *</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const }}
                >
                  <option value="AWS">☁️ AWS Track</option>
                  <option value="GenAI">🤖 GenAI Track</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Month *</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project, technologies used, and key features..."
                style={{ ...inputStyle, minHeight: '110px', resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>

            {/* GitHub link */}
            <div>
              <label style={labelStyle}>GitHub Repository Link</label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/username/repository"
                style={inputStyle}
              />
            </div>

            {/* File upload */}
            <div>
              <label style={labelStyle}>Project Documentation (PDF/DOC)</label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#f8f9fc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#64748b',
                fontWeight: '600',
                transition: 'all 0.18s',
              }}>
                <FileText size={16} />
                {document ? document.name : 'Click to attach PDF or DOC'}
                <input
                  type="file"
                  onChange={(e) => setDocument(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Submit */}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!name || !description || submitMutation.isPending}
              style={{
                padding: '12px',
                background: !name || !description ? '#e2e8f0' : 'linear-gradient(135deg,#06b6d4,#0891b2)',
                border: 'none',
                borderRadius: '9px',
                color: !name || !description ? '#94a3b8' : '#fff',
                fontWeight: '700',
                fontSize: '15px',
                cursor: !name || !description ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.18s',
              }}
            >
              {submitMutation.isPending ? 'Submitting...' : '🚀 Submit Project'}
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          My Submitted Projects
        </h3>

        {isLoading ? (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading projects...</p>
        ) : projects && projects.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {projects.map((project: any) => (
              <div
                key={project.id}
                style={{
                  padding: '22px',
                  background: '#f8faff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: '#0f172a', fontSize: '17px', fontWeight: '800', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {project.name}
                      </h4>
                      <span style={trackStyle(project.track)}>{project.track}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <Calendar size={13} color="#94a3b8" />
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
                        {new Date(project.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '14px', lineHeight: '1.65' }}>
                      {project.description}
                    </p>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {project.github_link && (
                        <a
                          href={project.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            color: '#334155',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.18s',
                          }}
                          onMouseOver={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#dbeafe';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = '#93c5fd';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#1d4ed8';
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#f1f5f9';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#334155';
                          }}
                        >
                          <Github size={15} />
                          View Repository
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {project.document_url && (
                        <a
                          href={project.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            color: '#334155',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.18s',
                          }}
                          onMouseOver={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#dcfce7';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = '#86efac';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#15803d';
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = '#f1f5f9';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0';
                            (e.currentTarget as HTMLAnchorElement).style.color = '#334155';
                          }}
                        >
                          <FileText size={15} />
                          Documentation
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status + Grade */}
                  <div style={{ textAlign: 'right', minWidth: '110px', marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={statusStyle(project.status)}>{project.status}</span>

                    {project.grade && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Award size={18} color={gradeIconColor(project.grade)} />
                        <span style={gradeStyle(project.grade)}>{project.grade}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback */}
                {project.feedback && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    background: '#eff6ff',
                    borderRadius: '9px',
                    borderLeft: '3px solid #3b82f6',
                  }}>
                    <p style={{ margin: '0 0 3px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Feedback
                    </p>
                    <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
                      {project.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '52px 20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={28} color="#0891b2" />
            </div>
            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>No projects yet</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Click "Submit New Project" to get started</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InternProjects;