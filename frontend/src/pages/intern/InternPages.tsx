import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

// Intern Dashboard
export const InternDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['intern-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/intern/stats');
      return res.data;
    },
  });

  const cardStyle = { background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' };

  return (
    <PageShell title="Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FileText size={24} color="#00d4aa" />
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Logs</h3>
          </div>
          <p style={{ margin: '8px 0', fontSize: '28px', color: '#00d4aa', fontWeight: 'bold' }}>{stats?.logs?.verified || 0}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Verified ({stats?.logs?.pending || 0} pending)</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <CheckCircle size={24} color="#22c55e" />
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Tasks</h3>
          </div>
          <p style={{ margin: '8px 0', fontSize: '28px', color: '#22c55e', fontWeight: 'bold' }}>{stats?.tasks?.completed || 0}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Completed ({stats?.tasks?.pending || 0} pending)</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <DollarSign size={24} color="#f97316" />
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Expenses</h3>
          </div>
          <p style={{ margin: '8px 0', fontSize: '28px', color: '#f97316', fontWeight: 'bold' }}>₹{stats?.expenses?.approved_total || 0}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Approved</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Clock size={24} color="#3b82f6" />
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Attendance</h3>
          </div>
          <p style={{ margin: '8px 0', fontSize: '28px', color: '#3b82f6', fontWeight: 'bold' }}>{stats?.attendance?.present || 0}</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Present days</p>
        </div>
      </div>

      {stats?.stipend && (
        <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Current Month Stipend</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Base Amount</p>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '18px' }}>₹{stats.stipend.base_amount}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Total</p>
              <p style={{ margin: 0, color: '#00d4aa', fontSize: '22px', fontWeight: 'bold' }}>₹{stats.stipend.total_amount}</p>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

// Intern Logs
export const InternLogs = () => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ['my-logs'],
    queryFn: async () => {
      const res = await api.get('/logs/my-logs');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('content', content);
      if (file) formData.append('proof', file);
      const res = await api.post('/logs/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Log submitted successfully!');
      setContent('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-logs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit log');
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs?.find((l: any) => l.date === today);

  return (
    <PageShell title="Work Logs">
      {!todayLog && (
        <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Submit Today's Log</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you work on today?"
            style={{ width: '100%', minHeight: '120px', padding: '12px', background: '#0d1b2e', border: '1px solid #1f2a3c', borderRadius: '8px', color: '#e2e8f0', fontSize: '15px', resize: 'vertical', marginBottom: '16px' }}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,.pdf,.doc,.docx"
            style={{ marginBottom: '16px', color: '#64748b' }}
          />
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!content || submitMutation.isPending}
            style={{ padding: '12px 24px', background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#0a0e1a', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Log'}
          </button>
        </div>
      )}

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Logs</h3>
        {logs && logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map((log: any) => (
              <div key={log.id} style={{ padding: '16px', background: '#0d1b2e', borderRadius: '8px', border: '1px solid #1f2a3c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{log.date}</span>
                  <span style={{ color: log.status === 'verified' ? '#22c55e' : log.status === 'rejected' ? '#ef4444' : '#f97316', textTransform: 'uppercase', fontSize: '12px', fontFamily: 'monospace' }}>
                    {log.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#e2e8f0' }}>{log.content}</p>
                {log.comment && <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>Comment: {log.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No logs yet</p>
        )}
      </div>
    </PageShell>
  );
};

// Intern Tasks
export const InternTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks/my-tasks');
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Task updated!');
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f97316' : '#22c55e';

  return (
    <PageShell title="Tasks">
      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        {tasks && tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tasks.map((task: any) => (
              <div key={task.id} style={{ padding: '20px', background: '#0d1b2e', borderRadius: '8px', border: '1px solid #1f2a3c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '18px' }}>{task.title}</h4>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>Assigned by: {task.assigned_by_name}</p>
                  </div>
                  <span style={{ padding: '4px 12px', background: priorityColor(task.priority) + '22', color: priorityColor(task.priority), borderRadius: '6px', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    {task.priority}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', color: '#e2e8f0' }}>{task.description}</p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Due: {task.due_date}</p>
                  <select
                    value={task.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: task.id, status: e.target.value })}
                    style={{ padding: '8px 12px', background: '#111827', border: '1px solid #1f2a3c', borderRadius: '6px', color: '#e2e8f0' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No tasks assigned</p>
        )}
      </div>
    </PageShell>
  );
};

// Intern Expenses
export const InternExpenses = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: expenses } = useQuery({
    queryKey: ['my-expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses/my-expenses');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('description', description);
      formData.append('date', new Date().toISOString().split('T')[0]);
      if (file) formData.append('receipt', file);
      await api.post('/expenses/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Expense submitted!');
      setAmount('');
      setDescription('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
    },
  });

  return (
    <PageShell title="Expenses">
      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>Submit Expense Claim</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹)"
            style={{ padding: '12px', background: '#0d1b2e', border: '1px solid #1f2a3c', borderRadius: '8px', color: '#e2e8f0' }}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            style={{ padding: '12px', background: '#0d1b2e', border: '1px solid #1f2a3c', borderRadius: '8px', color: '#e2e8f0' }}
          />
        </div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf" style={{ marginBottom: '16px', color: '#64748b' }} />
        <button
          onClick={() => submitMutation.mutate()}
          disabled={!amount || !description || submitMutation.isPending}
          style={{ padding: '12px 24px', background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#0a0e1a', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Submit Expense
        </button>
      </div>

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Expenses</h3>
        {expenses && expenses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.map((exp: any) => (
              <div key={exp.id} style={{ padding: '16px', background: '#0d1b2e', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '16px' }}>{exp.description}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{exp.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#00d4aa', fontSize: '18px', fontWeight: 'bold' }}>₹{exp.amount}</p>
                  <p style={{ margin: 0, color: exp.status === 'approved' ? '#22c55e' : exp.status === 'rejected' ? '#ef4444' : '#f97316', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    {exp.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No expenses</p>
        )}
      </div>
    </PageShell>
  );
};

// Intern Stipend
export const InternStipend = () => {
  const [loading, setLoading] = useState(false);

  const { data: stipends, isLoading, refetch } = useQuery({
    queryKey: ['my-stipends'],
    queryFn: async () => {
      const res = await api.get('/stipends/my-stipends');
      console.log('📊 Fetched stipends:', res.data);
      return res.data;
    },
  });

  const forceCalculate = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('ims-auth-storage');
      const parsed = JSON.parse(userStr || '{}');
      const user = parsed?.state?.user;

      const res = await api.get(`/stipends/test-auto-calc/${user.id}`);
      console.log('💰 Calculation result:', res.data);

      if (res.data.success) {
        toast.success('Stipend calculated: ₹' + res.data.stipend.total_amount);
        await refetch();
      } else {
        toast.error('Failed: ' + res.data.error);
      }
    } catch (error: any) {
      toast.error('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="My Stipend">
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <button
          onClick={forceCalculate}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#00d4aa',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0e1a',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ Calculating...' : '💰 Calculate Stipend'}
        </button>

        <button
          onClick={() => refetch()}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading stipends...</p>
        ) : stipends && stipends.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stipends.map((s: any) => (
              <div key={s.month} style={{ padding: '24px', background: '#0d1b2e', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '20px' }}>
                    {new Date(s.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <span
                    style={{
                      padding: '6px 16px',
                      background: s.paid ? '#22c55e22' : '#f9731622',
                      color: s.paid ? '#22c55e' : '#f97316',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {s.paid ? '✓ PAID' : '○ UNPAID'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>Days Present</p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold' }}>{s.days_present}</p>
                  </div>

                  <div style={{ padding: '16px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>Base Amount</p>
                    <p style={{ margin: 0, color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>₹{s.base_amount}</p>
                  </div>

                  <div style={{ padding: '16px', background: '#111827', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>Expenses</p>
                    <p style={{ margin: 0, color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}>₹{s.approved_expenses}</p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #00d4aa22 0%, #00d4aa11 100%)',
                    borderRadius: '12px',
                    border: '2px solid #00d4aa',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Stipend
                  </p>
                  <p style={{ margin: 0, color: '#00d4aa', fontSize: '36px', fontWeight: 'bold' }}>
                    ₹{s.total_amount.toLocaleString()}
                  </p>
                </div>

                <p style={{ margin: '16px 0 0 0', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                  ({s.days_present} days × ₹{s.daily_rate}) + ₹{s.approved_expenses} expenses = ₹{s.total_amount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
            <p style={{ color: '#64748b', fontSize: '18px', margin: '0 0 24px 0' }}>
              No stipends calculated yet
            </p>
            <button
              onClick={forceCalculate}
              disabled={loading}
              style={{
                padding: '14px 28px',
                background: '#00d4aa',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0e1a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '⏳ Calculating...' : '💰 Calculate My Stipend Now'}
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

// Intern Leave Requests
export const InternLeave = () => {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('casual');
  const queryClient = useQueryClient();

  const { data: leaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => {
      const res = await api.get('/leaves/my-leaves');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post('/leaves/request', {
        start_date: startDate,
        end_date: endDate,
        reason,
        leave_type: leaveType,
      });
    },
    onSuccess: () => {
      toast.success('Leave request submitted!');
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit leave');
    },
  });

  const statusColor = (s: string) =>
    s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  return (
    <PageShell title="Leave Requests">
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
        {showForm ? 'Cancel' : '+ Request Leave'}
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
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>New Leave Request</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                padding: '12px',
                background: '#0d1b2e',
                border: '1px solid #1f2a3c',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for leave..."
              style={{
                padding: '12px',
                background: '#0d1b2e',
                border: '1px solid #1f2a3c',
                borderRadius: '8px',
                color: '#e2e8f0',
                minHeight: '100px',
                resize: 'vertical',
              }}
            />

            <button
              onClick={() => submitMutation.mutate()}
              disabled={!startDate || !endDate || !reason || submitMutation.isPending}
              style={{
                padding: '12px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Submit Request
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Leave Requests</h3>
        {leaves && leaves.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaves.map((leave: any) => (
              <div
                key={leave.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '8px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span
                      style={{
                        padding: '4px 12px',
                        background: '#00d4aa22',
                        color: '#00d4aa',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    >
                      {leave.leave_type}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: statusColor(leave.status) + '22',
                      color: statusColor(leave.status),
                      borderRadius: '6px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {leave.status}
                  </span>
                </div>
                <p style={{ margin: '8px 0', color: '#e2e8f0' }}>
                  <strong>Duration:</strong> {leave.start_date} to {leave.end_date}
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>{leave.reason}</p>
                {leave.review_notes && (
                  <p style={{ margin: '12px 0 0 0', color: '#f97316', fontSize: '14px' }}>
                    <strong>Review Notes:</strong> {leave.review_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No leave requests</p>
        )}
      </div>
    </PageShell>
  );
};

// Intern WFH Requests
export const InternWFH = () => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data: wfhRequests } = useQuery({
    queryKey: ['my-wfh'],
    queryFn: async () => {
      const res = await api.get('/wfh/my-wfh');
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post('/wfh/request', { date, reason });
    },
    onSuccess: () => {
      toast.success('WFH request submitted!');
      setShowForm(false);
      setDate('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['my-wfh'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit WFH request');
    },
  });

  const statusColor = (s: string) =>
    s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#f97316';

  return (
    <PageShell title="Work From Home">
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
        {showForm ? 'Cancel' : '+ Request WFH'}
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
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>New WFH Request</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for WFH..."
              style={{
                padding: '12px',
                background: '#0d1b2e',
                border: '1px solid #1f2a3c',
                borderRadius: '8px',
                color: '#e2e8f0',
                minHeight: '100px',
                resize: 'vertical',
              }}
            />

            <button
              onClick={() => submitMutation.mutate()}
              disabled={!date || !reason || submitMutation.isPending}
              style={{
                padding: '12px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Submit Request
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My WFH Requests</h3>
        {wfhRequests && wfhRequests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {wfhRequests.map((wfh: any) => (
              <div
                key={wfh.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '8px',
                  border: '1px solid #1f2a3c',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>
                    {wfh.date}
                  </p>
                  <p style={{ margin: 0, color: '#64748b' }}>{wfh.reason}</p>
                </div>
                <span
                  style={{
                    padding: '6px 16px',
                    background: statusColor(wfh.status) + '22',
                    color: statusColor(wfh.status),
                    borderRadius: '6px',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                  }}
                >
                  {wfh.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No WFH requests</p>
        )}
      </div>
    </PageShell>
  );
};

// Intern Attendance
export const InternAttendance = () => {
  const { data: records } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/my-attendance');
      return res.data;
    },
  });

  const statusColor = (s: string) => s === 'present' ? '#22c55e' : s === 'late' ? '#f97316' : '#ef4444';

  return (
    <PageShell title="Attendance">
      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        {records && records.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {records.map((r: any) => (
              <div key={r.date} style={{ padding: '16px', background: '#0d1b2e', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '14px' }}>{r.date}</p>
                <p style={{ margin: 0, color: statusColor(r.status), fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {r.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No attendance records</p>
        )}
      </div>
    </PageShell>
  );
};
export { default as InternRelieving } from './InternRelieving';
export { default as InternComplaints } from './InternComplaints';
export { default as InternProjects } from './InternProjects';
export { default as InternKT } from './InternKT';