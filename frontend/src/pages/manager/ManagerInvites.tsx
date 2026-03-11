import PageShell from '../../components/layout/PageShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';

const ManagerInvites = () => {
  const queryClient = useQueryClient();

  const { data: invites } = useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => {
      const res = await api.get('/auth/invites');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await api.post('/auth/invites', { role });
      return res.data;
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.registration_url);
      toast.success('Invite created and URL copied!');
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied!');
  };

  return (
    <PageShell title="Generate Invites">
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => createMutation.mutate('intern')}
          style={{ padding: '12px 24px', background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#0a0e1a', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Generate Intern Invite
        </button>
      </div>

      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2a3c' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>My Invites</h3>
        {invites && invites.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invites.map((inv: any) => (
              <div key={inv.code} style={{ padding: '16px', background: '#0d1b2e', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontFamily: 'monospace' }}>{inv.code}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    Role: {inv.role} · {inv.used ? 'USED' : 'Available'}
                  </p>
                </div>
                <button
                  onClick={() => copyUrl(inv.registration_url)}
                  style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Copy size={16} />
                  Copy URL
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No invites created</p>
        )}
      </div>
    </PageShell>
  );
};

export default ManagerInvites;
