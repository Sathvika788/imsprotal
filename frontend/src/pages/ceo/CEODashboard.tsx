import PageShell from '../../components/layout/PageShell';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';

const Stat = ({ label, value, color, icon: Icon, sub }: any) => (
  <div style={{
    background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '22px 24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</span>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} strokeWidth={2} />
      </div>
    </div>
    <p style={{ margin: 0, fontSize: '30px', fontWeight: '700', color: '#0f1623', lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{sub}</p>}
  </div>
);

const CEODashboard = () => {
  const { data: analytics } = useQuery({
    queryKey: ['ceo-analytics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/ceo/analytics');
      return res.data;
    },
  });

  const attendanceData = analytics?.attendance ? [
    { name: 'Present', value: analytics.attendance.present, color: '#16a34a' },
    { name: 'Late', value: analytics.attendance.late, color: '#ea580c' },
    { name: 'Absent', value: analytics.attendance.absent, color: '#dc2626' },
  ] : [];

  const sectionHead = { margin: '0 0 18px', fontSize: '16px', fontWeight: '700', color: '#0f1623' };

  return (
    <PageShell title="Analytics Dashboard">
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <Stat label="Total Users" value={analytics?.overview?.total_users || 0} color="#6366f1" icon={Users} />
        <Stat label="Total Interns" value={analytics?.overview?.total_interns || 0} color="#0ea5e9" icon={Users} />
        <Stat label="Attendance Rate" value={`${analytics?.attendance?.attendance_rate?.toFixed(1) || 0}%`} color="#16a34a" icon={TrendingUp} sub="This month" />
        <Stat label="Task Completion" value={`${analytics?.tasks?.completion_rate?.toFixed(1) || 0}%`} color="#f59e0b" icon={CheckCircle} sub="All time" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
          <h3 style={sectionHead}>Daily Logs — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics?.recent_activity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f8" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
          <h3 style={sectionHead}>Attendance Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {attendanceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '8px', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {attendanceData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{d.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f1623', marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stipends & Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[
          {
            title: 'Stipend Overview',
            items: [
              { label: 'Total Amount', value: `₹${analytics?.stipends?.total_amount || 0}`, color: '#6366f1', big: true },
              { label: 'Paid', value: analytics?.stipends?.paid_count || 0, color: '#16a34a' },
              { label: 'Unpaid', value: analytics?.stipends?.unpaid_count || 0, color: '#ea580c' },
            ],
          },
          {
            title: 'Expenses Overview',
            items: [
              { label: 'Total Approved', value: `₹${analytics?.expenses?.total_amount || 0}`, color: '#16a34a', big: true },
              { label: 'Pending', value: analytics?.expenses?.pending || 0, color: '#ea580c' },
              { label: 'Approved', value: analytics?.expenses?.approved || 0, color: '#16a34a' },
            ],
          },
        ].map(({ title, items }) => (
          <div key={title} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
            <h3 style={sectionHead}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(({ label, value, color, big }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f8f9fc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</span>
                  <span style={{ fontSize: big ? '22px' : '18px', fontWeight: '700', color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default CEODashboard;