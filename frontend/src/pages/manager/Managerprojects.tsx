import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Github, FileText, Calendar, Award, ExternalLink,
  Filter, CheckCircle, XCircle, Star, Search,
  Clock, ChevronDown, RotateCcw,
} from 'lucide-react';

// ── Design tokens ───────────────────────────────────────────────────
const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#f8fafc', border: '1.5px solid #e2e8f0',
  borderRadius: '9px', color: '#0f172a', fontSize: '14px',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  display: 'block', marginBottom: '7px', fontSize: '11px',
  fontWeight: '700', color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.6px',
};

const gradeColor = (g: string) =>
  ['A+', 'A'].includes(g) ? '#16a34a' :
  ['B+', 'B'].includes(g) ? '#2563eb' :
  g === 'C' ? '#ea580c' :
  g === 'D' ? '#d97706' : '#dc2626';

const statusMap: Record<string, { color: string; bg: string; border: string }> = {
  approved: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pending:  { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
};

const statusBadge = (s: string): React.CSSProperties => {
  const c = statusMap[s] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 11px', borderRadius: '99px',
    fontSize: '11px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    color: c.color, background: c.bg, border: `1px solid ${c.border}`,
  };
};

const trackBadge = (t: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '3px 10px', borderRadius: '99px',
  fontSize: '11px', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '0.3px',
  color: t === 'AWS' ? '#92400e' : '#5b21b6',
  background: t === 'AWS' ? '#fef3c7' : '#ede9fe',
  border: `1px solid ${t === 'AWS' ? '#fde68a' : '#ddd6fe'}`,
});

// ── Review Modal ────────────────────────────────────────────────────
interface ReviewModalProps {
  project: any;
  onClose: () => void;
  onSubmit: (d: { status: string; grade: string; feedback: string }) => void;
  isPending: boolean;
}

const ReviewModal = ({ project, onClose, onSubmit, isPending }: ReviewModalProps) => {
  const [status, setStatus]     = useState<'approved' | 'rejected'>(
    project.status === 'rejected' ? 'rejected' : 'approved'
  );
  const [grade, setGrade]       = useState(project.grade || 'A');
  const [feedback, setFeedback] = useState(project.feedback || '');
  const isEdit = project.status !== 'pending';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(6px)', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
        padding: '32px', width: '100%', maxWidth: '540px',
        animation: 'fadeUpModal .25s ease',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {isEdit ? 'Update Review' : 'Review Project'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>by {project.intern_name}</p>
            </div>
          </div>
          {/* Project summary chip */}
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{project.name}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={trackBadge(project.track)}>{project.track === 'AWS' ? '☁️' : '🤖'} {project.track}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {new Date(project.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Decision */}
        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Decision *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(['approved', 'rejected'] as const).map((s) => {
              const active = status === s;
              const c = statusMap[s];
              return (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: '12px', border: `2px solid ${active ? c.color : '#e2e8f0'}`,
                  borderRadius: '10px', background: active ? c.bg : '#f8fafc',
                  color: active ? c.color : '#94a3b8',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  boxShadow: active ? `0 2px 8px ${c.color}22` : 'none',
                }}>
                  {s === 'approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade */}
        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Grade *</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {GRADES.map((g) => {
              const active = grade === g;
              const c = gradeColor(g);
              return (
                <button key={g} onClick={() => setGrade(g)} style={{
                  width: '46px', height: '46px',
                  border: `2px solid ${active ? c : '#e2e8f0'}`,
                  borderRadius: '10px',
                  background: active ? c : '#f8fafc',
                  color: active ? '#fff' : '#64748b',
                  fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 4px 12px ${c}44` : 'none',
                }}>
                  {g}
                </button>
              );
            })}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>
            {['A+', 'A'].includes(grade) ? '🌟 Excellent work' :
             ['B+', 'B'].includes(grade) ? '👍 Good work' :
             grade === 'C' ? '⚠️ Needs improvement' :
             grade === 'D' ? '🔴 Below expectations' : '❌ Does not meet requirements'}
          </p>
        </div>

        {/* Feedback */}
        <div style={{ marginBottom: '24px' }}>
          <label style={lbl}>Feedback *</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide constructive feedback on quality, approach, and areas for improvement..."
            style={{ ...inp, minHeight: '110px', resize: 'vertical', lineHeight: '1.65' }}
          />
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: feedback.trim().length >= 20 ? '#16a34a' : '#94a3b8' }}>
            {feedback.trim().length} chars {feedback.trim().length < 20 ? '· min 20 recommended' : '✓'}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', background: '#f1f5f9',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            color: '#374151', fontWeight: '600', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ status, grade, feedback })}
            disabled={!feedback.trim() || isPending}
            style={{
              flex: 2, padding: '12px', border: 'none', borderRadius: '10px',
              background: !feedback.trim()
                ? '#e2e8f0'
                : status === 'approved'
                ? 'linear-gradient(135deg,#16a34a,#15803d)'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: !feedback.trim() ? '#94a3b8' : '#fff',
              fontWeight: '700', fontSize: '14px',
              cursor: !feedback.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.18s',
              boxShadow: !feedback.trim() ? 'none' : `0 4px 14px ${statusMap[status].color}44`,
            }}
          >
            {isPending ? 'Submitting...' : `${isEdit ? 'Update' : 'Submit'} · Grade ${grade}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Project Card ─────────────────────────────────────────────────────
const ProjectCard = ({ project, onReview }: { project: any; onReview: (p: any) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isPending = project.status === 'pending';

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: isPending ? `2px solid ${statusMap.pending.border}` : '1px solid #e2e8f0',
      boxShadow: isPending ? '0 4px 20px rgba(234,88,12,0.07)' : '0 1px 6px rgba(0,0,0,0.05)',
      overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}>
      {/* Top accent stripe */}
      <div style={{
        height: '3px',
        background: isPending
          ? 'linear-gradient(90deg,#ea580c,#f97316)'
          : project.status === 'approved'
          ? 'linear-gradient(90deg,#16a34a,#22c55e)'
          : 'linear-gradient(90deg,#dc2626,#ef4444)',
      }} />

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Intern avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '13px', color: '#fff',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}>
                {project.intern_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{project.intern_name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{project.intern_email}</p>
              </div>
            </div>

            {/* Project name + track badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {project.name}
              </h4>
              <span style={trackBadge(project.track)}>
                {project.track === 'AWS' ? '☁️' : '🤖'} {project.track}
              </span>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="#94a3b8" />
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                  {new Date(project.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color="#94a3b8" />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Submitted {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Description */}
            <p style={{
              margin: '0 0 10px', fontSize: '13.5px', color: '#475569', lineHeight: '1.65',
              display: '-webkit-box' as any,
              WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical' as any,
              overflow: 'hidden',
            }}>
              {project.description}
            </p>

            {(project.description?.length ?? 0) > 180 && (
              <button onClick={() => setExpanded(!expanded)} style={{
                background: 'none', border: 'none', color: '#0891b2',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
              }}>
                {expanded ? 'Show less' : 'Read more'}
                <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}

            {/* Links */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {project.github_link && (
                <a href={project.github_link} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  color: '#374155', textDecoration: 'none', fontSize: '12px', fontWeight: '600',
                }}>
                  <Github size={13} /> Repository <ExternalLink size={10} />
                </a>
              )}
              {project.document_url && (
                <a href={project.document_url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  color: '#374155', textDecoration: 'none', fontSize: '12px', fontWeight: '600',
                }}>
                  <FileText size={13} /> Documentation <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Existing feedback */}
            {project.feedback && (
              <div style={{
                marginTop: '14px', padding: '12px 14px',
                background: '#eff6ff', borderRadius: '9px', borderLeft: '3px solid #3b82f6',
              }}>
                <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Feedback
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>{project.feedback}</p>
              </div>
            )}
          </div>

          {/* ── Right column: status / grade / action ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <span style={statusBadge(project.status)}>
              {project.status === 'approved' ? '✓' : project.status === 'rejected' ? '✗' : '⏳'} {project.status}
            </span>

            {project.grade && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 14px', background: '#f8fafc',
                borderRadius: '10px', border: '1px solid #e2e8f0',
              }}>
                <Award size={16} color={gradeColor(project.grade)} />
                <span style={{ fontSize: '22px', fontWeight: '900', color: gradeColor(project.grade), fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>
                  {project.grade}
                </span>
              </div>
            )}

            {isPending ? (
              <button onClick={() => onReview(project)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(6,182,212,0.28)',
              }}>
                <Star size={14} /> Review & Grade
              </button>
            ) : (
              <button onClick={() => onReview(project)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: '9px',
                color: '#64748b', fontWeight: '600', fontSize: '12px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <RotateCcw size={12} /> Re-review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────
const ManagerProjects = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [trackFilter, setTrackFilter]   = useState<'all' | 'AWS' | 'GenAI'>('all');
  const [search, setSearch]             = useState('');
  const [reviewing, setReviewing]       = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['all-projects'],
    queryFn: async () => {
      const res = await api.get('/projects/all');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.post(`/projects/${id}/review`, data);
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setReviewing(null);
      queryClient.invalidateQueries({ queryKey: ['all-projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    },
  });

  const counts = {
    all:      projects.length,
    pending:  projects.filter((p: any) => p.status === 'pending').length,
    approved: projects.filter((p: any) => p.status === 'approved').length,
    rejected: projects.filter((p: any) => p.status === 'rejected').length,
  };

  const filtered = projects.filter((p: any) => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchTrack  = trackFilter === 'all' || p.track === trackFilter;
    const matchSearch = !search.trim()
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.intern_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchTrack && matchSearch;
  });

  const pill = (label: string, active: boolean, onClick: () => void, color: string, bg: string) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: '99px',
      border: `1.5px solid ${active ? color : '#e2e8f0'}`,
      background: active ? bg : '#fff',
      color: active ? color : '#64748b',
      fontWeight: '700', fontSize: '12px', cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 0.15s',
      boxShadow: active ? `0 2px 8px ${color}22` : 'none',
    }}>
      {label}
    </button>
  );

  return (
    <PageShell title="Project Reviews">
      <style>{`
        @keyframes fadeUpModal { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {reviewing && (
        <ReviewModal
          project={reviewing}
          onClose={() => setReviewing(null)}
          onSubmit={(data) => reviewMutation.mutate({ id: reviewing.id, data })}
          isPending={reviewMutation.isPending}
        />
      )}

      {/* KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total Projects', value: counts.all,      color: '#0891b2', bg: '#ecfeff', icon: '📁' },
          { label: 'Pending Review', value: counts.pending,  color: '#ea580c', bg: '#fff7ed', icon: '⏳' },
          { label: 'Approved',       value: counts.approved, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
          { label: 'Rejected',       value: counts.rejected, color: '#dc2626', bg: '#fef2f2', icon: '❌' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
            </div>
            <p style={{ margin: 0, fontSize: '30px', fontWeight: '900', color, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
        padding: '14px 18px', marginBottom: '18px',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '9px', flex: '1', minWidth: '180px', maxWidth: '260px' }}>
          <Search size={14} color="#94a3b8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intern or project..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />
        <Filter size={13} color="#94a3b8" />

        {pill(`All (${counts.all})`,           statusFilter === 'all',      () => setStatusFilter('all'),      '#0891b2', '#ecfeff')}
        {pill(`⏳ Pending (${counts.pending})`,  statusFilter === 'pending',  () => setStatusFilter('pending'),  '#ea580c', '#fff7ed')}
        {pill(`✅ Approved (${counts.approved})`, statusFilter === 'approved', () => setStatusFilter('approved'), '#16a34a', '#f0fdf4')}
        {pill(`❌ Rejected (${counts.rejected})`, statusFilter === 'rejected', () => setStatusFilter('rejected'), '#dc2626', '#fef2f2')}

        <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />
        {pill('All Tracks',  trackFilter === 'all',    () => setTrackFilter('all'),    '#0891b2', '#ecfeff')}
        {pill('☁️ AWS',      trackFilter === 'AWS',    () => setTrackFilter('AWS'),    '#92400e', '#fef3c7')}
        {pill('🤖 GenAI',    trackFilter === 'GenAI',  () => setTrackFilter('GenAI'),  '#5b21b6', '#ede9fe')}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>
          Showing <strong style={{ color: '#0f172a' }}>{filtered.length}</strong> of {counts.all} projects
          {statusFilter !== 'all' && <> · <span style={{ color: statusMap[statusFilter]?.color }}>{statusFilter}</span></>}
          {trackFilter !== 'all' && <> · {trackFilter}</>}
        </p>
      )}

      {/* Project list */}
      {isLoading ? (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#06b6d4', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Loading projects...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((project: any) => (
            <ProjectCard key={project.id} project={project} onReview={setReviewing} />
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '72px 20px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px' }}>📁</div>
          <p style={{ color: '#334155', fontSize: '15px', fontWeight: '700', margin: '0 0 6px' }}>No projects found</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            {statusFilter !== 'all' || trackFilter !== 'all' || search
              ? 'Try adjusting your filters or search query'
              : 'Projects will appear once interns submit them'}
          </p>
        </div>
      )}
    </PageShell>
  );
};

export default ManagerProjects;