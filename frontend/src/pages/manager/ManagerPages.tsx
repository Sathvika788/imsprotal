import PageShell from '../../components/layout/PageShell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { User, Mail, Calendar, FileText } from 'lucide-react';
import toast from "react-hot-toast";
import React, { useState } from "react";

// Manager Stipends
export const ManagerStipends = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedIntern, setSelectedIntern] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Get all interns
  const { data: interns } = useQuery({
    queryKey: ['all-interns'],
    queryFn: async () => {
      const res = await api.get('/auth/users/interns');
      return res.data;
    },
  });

  // Get all stipends
  const { data: allStipends, isLoading } = useQuery({
    queryKey: ['all-stipends'],
    queryFn: async () => {
      const res = await api.get('/stipends/all-stipends');
      return res.data;
    },
  });

  const calculateStipend = async () => {
    if (!selectedIntern) {
      toast.error('Please select an intern');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stipends/calculate', {
        intern_id: selectedIntern,
        month: selectedMonth,
      });
      toast.success('Stipend calculated successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-stipends'] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to calculate stipend');
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (g: string) => {
    if (['A+', 'A'].includes(g)) return '#22c55e';
    if (['B+', 'B'].includes(g)) return '#3b82f6';
    if ('C' === g) return '#f97316';
    return '#ef4444';
  };

  return (
    <PageShell title="Stipend Management">
      {/* Calculate Section */}
      <div style={{
        background: '#111827',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #1f2a3c',
        marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Calculate Stipend</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
              Select Intern
            </label>
            <select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1b2e',
                border: '1px solid #1f2a3c',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
            >
              <option value="">-- Select Intern --</option>
              {interns?.map((intern: any) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name} ({intern.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
              Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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

          <button
            onClick={calculateStipend}
            disabled={loading || !selectedIntern}
            style={{
              padding: '12px 24px',
              background: '#00d4aa',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0e1a',
              fontWeight: 'bold',
              cursor: loading || !selectedIntern ? 'not-allowed' : 'pointer',
              opacity: loading || !selectedIntern ? 0.5 : 1,
            }}
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {/* All Stipends List */}
      <div style={{
        background: '#111827',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #1f2a3c',
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>All Stipends</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading stipends...</p>
        ) : allStipends && allStipends.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {allStipends.map((stipend: any) => (
              <div
                key={`${stipend.intern_id}-${stipend.month}`}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '18px' }}>
                      {stipend.intern_name || 'Unknown Intern'}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>
                      {stipend.intern_email}
                    </p>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                      {new Date(stipend.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '8px 16px',
                      background: stipend.paid ? '#22c55e22' : '#f9731622',
                      color: stipend.paid ? '#22c55e' : '#f97316',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {stipend.paid ? '✓ PAID' : '○ UNPAID'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Days Present</p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '20px', fontWeight: 'bold' }}>
                      {stipend.days_present}
                    </p>
                  </div>

                  <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Base Amount</p>
                    <p style={{ margin: 0, color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>
                      ₹{stipend.base_amount}
                    </p>
                  </div>

                  <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Expenses</p>
                    <p style={{ margin: 0, color: '#22c55e', fontSize: '20px', fontWeight: 'bold' }}>
                      ₹{stipend.approved_expenses}
                    </p>
                  </div>

                  <div style={{ padding: '12px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>Total</p>
                    <p style={{ margin: 0, color: '#00d4aa', fontSize: '20px', fontWeight: 'bold' }}>
                      ₹{stipend.total_amount}
                    </p>
                  </div>
                </div>

                <p style={{ margin: 0, color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                  ({stipend.days_present} days × ₹{stipend.daily_rate || 500}) + ₹{stipend.approved_expenses} = ₹{stipend.total_amount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No stipends calculated yet
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export const ManagerInterns = () => {
  const { data: interns, isLoading } = useQuery({
    queryKey: ['all-interns'],
    queryFn: async () => {
      // Fetch all interns by getting logs and extracting unique intern info
      const today = new Date().toISOString().split('T')[0];
      const logsRes = await api.get(`/logs/date/${today}`);
      
      // Get unique interns from logs
      const internMap = new Map();
      logsRes.data.forEach((log: any) => {
        if (!internMap.has(log.intern_id)) {
          internMap.set(log.intern_id, {
            id: log.intern_id,
            name: log.intern_name,
            email: log.intern_email,
          });
        }
      });
      
      // If no logs today, try to get from expenses
      if (internMap.size === 0) {
        const expensesRes = await api.get('/expenses/all');
        expensesRes.data.forEach((exp: any) => {
          if (!internMap.has(exp.intern_id)) {
            internMap.set(exp.intern_id, {
              id: exp.intern_id,
              name: exp.intern_name,
              email: exp.intern_email,
            });
          }
        });
      }
      
      return Array.from(internMap.values());
    },
  });

  const cardStyle = {
    background: '#111827',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #1f2a3c',
  };

  return (
    <PageShell title="Manage Interns">
      {isLoading ? (
        <div style={cardStyle}>
          <p style={{ color: '#64748b' }}>Loading interns...</p>
        </div>
      ) : interns && interns.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {interns.map((intern: any) => (
            <div key={intern.id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#00d4aa22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={24} color="#00d4aa" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '18px' }}>
                    {intern.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="#64748b" />
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      {intern.email}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => (window.location.href = `/manager/logs?intern=${intern.id}`)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={14} />
                  View Logs
                </button>
                <button
                  onClick={() => (window.location.href = `/manager/attendance?intern=${intern.id}`)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#22c55e',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Calendar size={14} />
                  Attendance
                </button>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: '#0d1b2e',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                ID: {intern.id}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{ color: '#64748b' }}>
            No interns found. Interns will appear here once they start submitting logs or expenses.
          </p>
        </div>
      )}
    </PageShell>
  );
};

export const ManagerAttendance = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  const { data: attendance } = useQuery({
    queryKey: ['attendance-by-date', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/attendance/date/${selectedDate}`);
      return res.data;
    },
  });

  const statusColor = (status: string) =>
    status === 'present' ? '#22c55e' : status === 'late' ? '#f97316' : '#ef4444';

  return (
    <PageShell title="Manage Attendance">
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px' }}>
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '12px',
            background: '#111827',
            border: '1px solid #1f2a3c',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
        />
      </div>

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        {attendance && attendance.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {attendance.map((record: any) => (
              <div
                key={`${record.intern_id}-${record.date}`}
                style={{
                  padding: '16px',
                  background: '#0d1b2e',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                    {record.intern_name}
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{record.intern_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      padding: '6px 16px',
                      background: statusColor(record.status) + '22',
                      color: statusColor(record.status),
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No attendance records for this date</p>
        )}
      </div>
    </PageShell>
  );
};
export { default as ManagerRelievings } from './ManagerRelievings';
export { default as ManagerComplaints } from './ManagerComplaints';
export { default as ManagerReports } from './ManagerReports';
export { default as ManagerKT } from './ManagerKT';