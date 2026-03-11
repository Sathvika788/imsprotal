import { useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

const ManagerTasks = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const queryClient = useQueryClient();

  // Get all interns
  const { data: interns, isLoading: internsLoading } = useQuery({
    queryKey: ['interns'],
    queryFn: async () => {
      const res = await api.get('/auth/users/interns');
      return res.data;
    },
  });

  // Get all tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks/all');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/tasks/', {
        assigned_to_email: assignedToEmail,
        title,
        description,
        priority,
        due_date: dueDate || null,
      });
    },
    onSuccess: () => {
      toast.success('Task created successfully!');
      setShowForm(false);
      setTitle('');
      setDescription('');
      setAssignedToEmail('');
      setPriority('medium');
      setDueDate('');
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast.success('Task deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    },
  });

  const priorityColor = (p: string) => {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f97316';
    return '#22c55e';
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return '#22c55e';
    if (s === 'in_progress') return '#3b82f6';
    return '#f97316';
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete task: "${taskTitle}"?`)) {
      deleteMutation.mutate(taskId);
    }
  };

  return (
    <PageShell title="Task Management">
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Plus size={18} />
        {showForm ? 'Cancel' : 'Create New Task'}
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
          <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>Create New Task</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Assign to Intern (Email) *
              </label>
              {internsLoading ? (
                <p style={{ color: '#64748b', fontSize: '14px' }}>Loading interns...</p>
              ) : (
                <select
                  value={assignedToEmail}
                  onChange={(e) => setAssignedToEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0d1b2e',
                    border: '1px solid #1f2a3c',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                  }}
                >
                  <option value="">-- Select Intern --</option>
                  {interns && interns.length > 0 ? (
                    interns.map((intern: any) => (
                      <option key={intern.id} value={intern.email}>
                        {intern.name} ({intern.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No interns available</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
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
                placeholder="Enter task description"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0d1b2e',
                  border: '1px solid #1f2a3c',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  minHeight: '100px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0d1b2e',
                    border: '1px solid #1f2a3c',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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

            <button
              onClick={() => createMutation.mutate()}
              disabled={!title || !description || !assignedToEmail || createMutation.isPending}
              style={{
                padding: '12px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: !title || !description || !assignedToEmail ? 'not-allowed' : 'pointer',
                opacity: !title || !description || !assignedToEmail ? 0.5 : 1,
              }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
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
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>All Tasks</h3>

        {isLoading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : tasks && tasks.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {tasks.map((task: any) => (
              <div
                key={task.id}
                style={{
                  padding: '20px',
                  background: '#0d1b2e',
                  borderRadius: '12px',
                  border: '1px solid #1f2a3c',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0', fontSize: '18px' }}>
                      {task.title}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px' }}>
                      {task.description}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: priorityColor(task.priority) + '22',
                          color: priorityColor(task.priority),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.priority}
                      </span>

                      <span
                        style={{
                          padding: '4px 12px',
                          background: statusColor(task.status) + '22',
                          color: statusColor(task.status),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.status.replace('_', ' ')}
                      </span>

                      {task.due_date && (
                        <span
                          style={{
                            padding: '4px 12px',
                            background: '#64748b22',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={12} />
                          Due: {task.due_date}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      Assigned to: <strong style={{ color: '#00d4aa' }}>{task.assigned_to_email}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    disabled={deleteMutation.isPending}
                    style={{
                      padding: '8px',
                      background: '#ef444422',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <AlertCircle size={48} color="#64748b" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              No tasks created yet
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerTasks;