import PageShell from "../../components/layout/PageShell";
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, FileText, Receipt, AlertCircle } from 'lucide-react';

const ManagerDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/manager/stats');
      return res.data;
    },
  });

  const cards = [
    { label: 'Total Interns', value: stats?.total_interns || 0, icon: Users, iconColor: '#fff', bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', desc: 'Active interns' },
    { label: 'Pending Verifications', value: stats?.pending_verifications || 0, icon: FileText, iconColor: '#fff', bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', desc: 'Logs awaiting review' },
    { label: 'Pending Expenses', value: stats?.pending_expenses || 0, icon: Receipt, iconColor: '#fff', bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', desc: 'Claims to process' },
    { label: 'Overdue Tasks', value: stats?.overdue_tasks || 0, icon: AlertCircle, iconColor: '#fff', bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', desc: 'Past due date' },
  ];

  return (
    <PageShell title="Manager Dashboard">
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        padding: '32px 24px',
        borderRadius: '20px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1e3a8a',
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Welcome Back! 👋
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            Here's your management overview
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {cards.map(({ label, value, icon: Icon, iconColor, bgGradient, desc }) => (
            <div key={label} style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              padding: '28px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: bgGradient,
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#475569',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {label}
                </span>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: bgGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease'
                }}>
                  <Icon size={28} color={iconColor} strokeWidth={2.5} />
                </div>
              </div>

              <p style={{
                margin: '0 0 12px 0',
                fontSize: '40px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1
              }}>
                {value}
              </p>

              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
        }}>
          <p style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            📊 Keep up with your tasks!
          </p>
          <p style={{
            fontSize: '14px',
            margin: 0,
            opacity: 0.9
          }}>
            Monitor your team's progress and stay on top of pending items
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default ManagerDashboard;