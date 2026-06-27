import { useEffect, useState } from 'react';
import { Check, X as XIcon, Ban, UserCircle } from 'lucide-react';
import { userApi } from '../api/users';
import { Card, Alert } from '../components/Card';
import { ROLE_LABELS } from '../utils/constants';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'suspended'];

export default function UserApprovals() {
  const [tab, setTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await userApi.list({ status: tab, limit: 100 });
      setUsers(data.data.users);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleAction(userItem, action) {
    setActingId(userItem._id);
    try {
      if (action === 'approve') await userApi.approve(userItem._id);
      if (action === 'reject') await userApi.reject(userItem._id);
      if (action === 'suspend') await userApi.suspend(userItem._id);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">User Approvals</h1>
        <p className="text-[var(--color-ink)]/60 text-sm mt-1">Review and manage registration requests.</p>
      </div>

      <div className="flex gap-1.5 mb-6 border-b border-[var(--color-paper-line)]">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[var(--color-terracotta)] text-[var(--color-terracotta)]' : 'border-transparent text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">No {tab} users.</Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u._id} className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ink)]/8 flex items-center justify-center shrink-0">
                  <UserCircle size={22} className="text-[var(--color-ink)]/50" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-ink)] truncate">{u.fullName}</p>
                  <p className="text-xs text-[var(--color-ink)]/55 truncate">{u.email} · {u.universityId}</p>
                  <p className="text-xs text-[var(--color-ink)]/45 mt-0.5">
                    {ROLE_LABELS[u.role]} · {u.campusId?.name} {u.departmentId && `· ${u.departmentId.name}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {tab === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(u, 'approve')}
                      disabled={actingId === u._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-sm font-semibold bg-[var(--color-ink-soft)]/10 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft)]/20 disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(u, 'reject')}
                      disabled={actingId === u._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-sm font-semibold bg-[var(--color-urgent)]/10 text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/20 disabled:opacity-50"
                    >
                      <XIcon size={14} /> Reject
                    </button>
                  </>
                )}
                {tab === 'approved' && (
                  <button
                    onClick={() => handleAction(u, 'suspend')}
                    disabled={actingId === u._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-sm font-semibold bg-black/5 text-[var(--color-ink)]/70 hover:bg-black/10 disabled:opacity-50"
                  >
                    <Ban size={14} /> Suspend
                  </button>
                )}
                {tab === 'rejected' && (
                  <button
                    onClick={() => handleAction(u, 'approve')}
                    disabled={actingId === u._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-sm font-semibold bg-[var(--color-ink-soft)]/10 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft)]/20 disabled:opacity-50"
                  >
                    <Check size={14} /> Approve instead
                  </button>
                )}
                {tab === 'suspended' && (
                  <button
                    onClick={() => handleAction(u, 'approve')}
                    disabled={actingId === u._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-sm font-semibold bg-[var(--color-ink-soft)]/10 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft)]/20 disabled:opacity-50"
                  >
                    <Check size={14} /> Reinstate
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
