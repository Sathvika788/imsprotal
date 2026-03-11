import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Github, FileText, Calendar, Award, ExternalLink,
  Filter, CheckCircle, XCircle, Star, Search,
  TrendingUp, BarChart2, Users, Clock, ChevronDown, RotateCcw,
} from 'lucide-react';

// ── Tokens (same design language as ManagerProjects) ────────────────
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

// ── Review Modal (same as Manager) ─────────────────────────────────
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
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {isEdit ? 'Update Review' : 'Review Project'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>by {project.intern_name}</p>
            </div>
          </div>
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
            {['A+', 'A'].includes(grade) ? '🌟 Excellent' : ['B+', 'B'].includes(grade) ? '👍 Good' : grade === 'C' ? '⚠️ Needs improvement' : grade === 'D' ? '🔴 Below expectations' : '❌ Failing'}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={lbl}>Feedback *</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide constructive feedback..."
            style={{ ...inp, minHeight: '110px', resize: 'vertical', lineHeight: '1.65' }}
          />
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: feedback.trim().length >= 20 ? '#16a34a' : '#94a3b8' }}>
            {feedback.trim().length} chars {feedback.trim().length < 20 ? '· min 20 recommended' : '✓'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', background: '#f1f5f9',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            color: '#374151', fontWeight: '600', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button
            onClick={() => onSubmit({ status, grade, feedback })}
            disabled={!feedback.trim() || isPending}
            style={{
              flex: 2, padding: '12px', border: 'none', borderRadius: '10px',
              background: !feedback.trim() ? '#e2e8f0' :
                status === 'approved' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: !feedback.trim() ? '#94a3b8' : '#fff',
              fontWeight: '700', fontSize: '14px',
              cursor: !feedback.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Submitting...' : `${isEdit ? 'Update' : 'Submit'} · Grade ${grade}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Analytics Panel ──────────────────────────────────────────────────
const AnalyticsPanel = ({ projects }: { projects: any[] }) => {
  const total    = projects.length;
  const approved = projects.filter((p) => p.status === 'approved').length;
  const pending  = projects.filter((p) => p.status === 'pending').length;
  const aws      = projects.filter((p) => p.track === 'AWS').length;
  const genai    = projects.filter((p) => p.track === 'GenAI').length;

  // Grade distribution (approved only)
  const gradedProjects = projects.filter((p) => p.grade);
  const gradeCounts: Record<string, number> = {};
  GRADES.forEach((g) => { gradeCounts[g] = gradedProjects.filter((p) => p.grade === g).length; });
  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

  // Approval rate
  const approvalRate = total > 0 ? Math.round((approved / (total - pending)) * 100) || 0 : 0;

  // Top graded interns
  const internScores: Record<string, { name: string; grades: string[]; avg: number }> = {};
  const gradePoints: Record<string, number> = { 'A+': 4.3, 'A': 4.0, 'B+': 3.3, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0 };
  projects.filter((p) => p.grade).forEach((p) => {
    if (!internScores[p.intern_id]) {
      internScores[p.intern_id] = { name: p.intern_name, grades: [], avg: 0 };
    }
    internScores[p.intern_id].grades.push(p.grade);
  });
  Object.values(internScores).forEach((s) => {
    s.avg = s.grades.reduce((acc, g) => acc + (gradePoints[g] || 0), 0) / s.grades.length;
  });
  const topInterns = Object.values(internScores)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const row = (label: string, a: number, b: number, colorA: string, colorB: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', color: '#64748b', width: '48px', fontWeight: '600', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: total > 0 ? `${(a / total) * 100}%` : '0%', height: '100%', background: colorA, borderRadius: '99px', transition: 'width .7s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color: colorA, width: '24px', textAlign: 'right' }}>{a}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '22px' }}>

      {/* Overview card */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={16} color="#0891b2" />
          </div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Overview</h4>
        </div>

        {row('AWS',    aws,    0,    '#92400e', '#92400e')}
        {row('GenAI',  genai,  0,    '#5b21b6', '#5b21b6')}

        <div style={{ height: '1px', background: '#f1f5f9', margin: '12px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { l: 'Approved',  v: approved,      c: '#16a34a', bg: '#f0fdf4' },
            { l: 'Pending',   v: pending,       c: '#ea580c', bg: '#fff7ed' },
            { l: 'Approval %', v: `${approvalRate}%`, c: '#0891b2', bg: '#ecfeff' },
            { l: 'Graded',    v: gradedProjects.length, c: '#7c3aed', bg: '#f5f3ff' },
          ].map(({ l, v, c, bg }) => (
            <div key={l} style={{ padding: '10px', background: bg, borderRadius: '9px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: c, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grade distribution */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={16} color="#d97706" />
          </div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Grade Distribution</h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', marginBottom: '10px' }}>
          {GRADES.map((g) => {
            const count = gradeCounts[g];
            const height = maxGradeCount > 0 ? (count / maxGradeCount) * 100 : 0;
            const color = gradeColor(g);
            return (
              <div key={g} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                {count > 0 && <span style={{ fontSize: '10px', fontWeight: '700', color }}>{count}</span>}
                <div style={{ width: '100%', height: `${Math.max(height, count > 0 ? 8 : 0)}%`, background: count > 0 ? color : '#f1f5f9', borderRadius: '4px 4px 0 0', minHeight: count > 0 ? '8px' : '4px', transition: 'height .6s ease' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
          {GRADES.map((g) => (
            <span key={g} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: gradeColor(g) }}>{g}</span>
          ))}
        </div>

        {gradedProjects.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '8px 0 0' }}>No graded projects yet</p>
        )}
      </div>

      {/* Top performers */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="#16a34a" />
          </div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Top Performers</h4>
        </div>

        {topInterns.length > 0 ? topInterns.map((intern, i) => (
          <div key={intern.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < topInterns.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#fff', flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {intern.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{intern.name}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{intern.grades.join(', ')}</p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: gradeColor(intern.grades[0]), flexShrink: 0 }}>
              {intern.grades[0]}
            </span>
          </div>
        )) : (
          <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>No graded projects yet</p>
        )}
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
      <div style={{ height: '3px', background: isPending ? 'linear-gradient(90deg,#ea580c,#f97316)' : project.status === 'approved' ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#dc2626,#ef4444)' }} />

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Intern */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#fff', flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {project.intern_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{project.intern_name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{project.intern_email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{project.name}</h4>
              <span style={trackBadge(project.track)}>{project.track === 'AWS' ? '☁️' : '🤖'} {project.track}</span>
            </div>

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
                  {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {project.reviewed_by && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Reviewed by manager</span>
                </div>
              )}
            </div>

            <p style={{
              margin: '0 0 10px', fontSize: '13.5px', color: '#475569', lineHeight: '1.65',
              display: '-webkit-box' as any, WebkitLineClamp: expanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
            }}>
              {project.description}
            </p>

            {(project.description?.length ?? 0) > 180 && (
              <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: '#0891b2', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                {expanded ? 'Show less' : 'Read more'}
                <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {project.github_link && (
                <a href={project.github_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#374155', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                  <Github size={13} /> Repository <ExternalLink size={10} />
                </a>
              )}
              {project.document_url && (
                <a href={project.document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#374155', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                  <FileText size={13} /> Documentation <ExternalLink size={10} />
                </a>
              )}
            </div>

            {project.feedback && (
              <div style={{ marginTop: '14px', padding: '12px 14px', background: '#eff6ff', borderRadius: '9px', borderLeft: '3px solid #3b82f6' }}>
                <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>{project.feedback}</p>
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <span style={statusBadge(project.status)}>
              {project.status === 'approved' ? '✓' : project.status === 'rejected' ? '✗' : '⏳'} {project.status}
            </span>

            {project.grade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <Award size={16} color={gradeColor(project.grade)} />
                <span style={{ fontSize: '22px', fontWeight: '900', color: gradeColor(project.grade), fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>
                  {project.grade}
                </span>
              </div>
            )}

            {isPending ? (
              <button onClick={() => onReview(project)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(6,182,212,0.28)' }}>
                <Star size={14} /> Review & Grade
              </button>
            ) : (
              <button onClick={() => onReview(project)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', color: '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <RotateCcw size={12} /> Re-review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────
const CEOProjects = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [trackFilter, setTrackFilter]   = useState<'all' | 'AWS' | 'GenAI'>('all');
  const [search, setSearch]             = useState('');
  const [view, setView]                 = useState<'list' | 'analytics'>('analytics');
  const [reviewing, setReviewing]       = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['all-projects-ceo'],
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
      toast.success('Review submitted!');
      setReviewing(null);
      queryClient.invalidateQueries({ queryKey: ['all-projects-ceo'] });
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
    <PageShell title="Project Overview">
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

      {/* Page header with view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Project Overview
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            {counts.all} total · {counts.pending} pending review
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#f1f5f9', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          {(['analytics', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 16px', borderRadius: '7px', border: 'none',
              background: view === v ? '#fff' : 'transparent',
              color: view === v ? '#0f172a' : '#64748b',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
              boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {v === 'analytics' ? <><BarChart2 size={14} /> Analytics</> : <><Filter size={14} /> All Projects</>}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics panel */}
      {view === 'analytics' && !isLoading && <AnalyticsPanel projects={projects} />}

      {/* Filters (always visible in list view; also in analytics for drilling down) */}
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
        {pill('All Tracks',  trackFilter === 'all',   () => setTrackFilter('all'),   '#0891b2', '#ecfeff')}
        {pill('☁️ AWS',      trackFilter === 'AWS',   () => setTrackFilter('AWS'),   '#92400e', '#fef3c7')}
        {pill('🤖 GenAI',    trackFilter === 'GenAI', () => setTrackFilter('GenAI'), '#5b21b6', '#ede9fe')}
      </div>

      {!isLoading && (
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>
          Showing <strong style={{ color: '#0f172a' }}>{filtered.length}</strong> of {counts.all} projects
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
              ? 'Try adjusting your filters'
              : 'Projects will appear once interns submit them'}
          </p>
        </div>
      )}
    </PageShell>
  );
};

export default CEOProjects;