import { useEffect, useState } from 'react';
import { Plus, Pin, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { noticeApi } from '../api/notices';
import { Card, Alert } from '../components/Card';
import { Field, Input, Textarea, Select } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { NOTICE_PRIORITIES } from '../utils/constants';
import { canManageContent, isOwner } from '../utils/permissions';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const emptyForm = { title: '', body: '', priority: 'normal', isPinned: false };

export default function Notices() {
  const { user } = useAuth();
  const canCreate = canManageContent(user.role);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadNotices() {
    setLoading(true);
    try {
      const { data } = await noticeApi.list({ limit: 50 });
      setNotices(data.data.notices);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(notice) {
    setEditing(notice);
    setForm({
      title: notice.title,
      body: notice.body,
      priority: notice.priority,
      isPinned: notice.isPinned,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await noticeApi.update(editing._id, form);
      } else {
        await noticeApi.create(form);
      }
      setModalOpen(false);
      await loadNotices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save notice');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(notice) {
    if (!confirm(`Delete notice "${notice.title}"? This cannot be undone.`)) return;
    try {
      await noticeApi.remove(notice._id);
      await loadNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete notice');
    }
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Notices</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Official announcements for your campus and department.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Post notice
          </Button>
        )}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}
        </div>
      ) : notices.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">No notices yet.</Card>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const priorityColor =
              notice.priority === 'urgent'
                ? 'var(--color-urgent)'
                : notice.priority === 'high'
                ? 'var(--color-gold)'
                : 'var(--color-ink)';
            const canEdit =
              canManageContent(user.role) &&
              (isOwner(notice, 'postedBy', user._id) || ['super_admin', 'campus_admin', 'dept_head'].includes(user.role));

            return (
              <Card key={notice._id} className="p-4 sm:p-5" style={{ borderLeftWidth: '4px', borderLeftColor: priorityColor }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {notice.isPinned && <Pin size={13} className="text-[var(--color-terracotta)]" />}
                      {notice.priority !== 'normal' && (
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: priorityColor }}>
                          {notice.priority}
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-ink)]/40">{formatDateTime(notice.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-[var(--color-ink)]">{notice.title}</h3>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-1.5 whitespace-pre-wrap leading-relaxed">{notice.body}</p>
                    <p className="text-xs text-[var(--color-ink)]/40 mt-2">
                      Posted by {notice.postedBy?.fullName || 'Unknown'}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(notice)} className="p-2 text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] hover:bg-black/5 rounded-md" aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(notice)} className="p-2 text-[var(--color-ink)]/50 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit notice' : 'Post a notice'}>
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={handleSubmit}>
          <Field label="Title" htmlFor="title">
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Body" htmlFor="body">
            <Textarea id="body" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority" htmlFor="priority">
              <Select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {NOTICE_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-terracotta)]"
                />
                Pin to top
              </label>
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            {editing ? 'Save changes' : 'Post notice'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
