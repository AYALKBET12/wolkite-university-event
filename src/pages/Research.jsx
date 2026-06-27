import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X as XIcon, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { researchApi } from '../api/opportunities';
import { Card, Alert } from '../components/Card';
import { Field, Input, Textarea } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { canModerate, isOwner } from '../utils/permissions';

const STATUS_STYLE = {
  pending: { label: 'Pending review', color: 'var(--color-gold)' },
  approved: { label: 'Approved', color: 'var(--color-ink-soft)' },
  rejected: { label: 'Rejected', color: 'var(--color-urgent)' },
};

const emptyForm = { title: '', abstractText: '', keywords: '', fileUrl: '', publishedYear: '' };

export default function Research() {
  const { user } = useAuth();
  const isModerator = canModerate(user.role);

  const [tab, setTab] = useState('all'); // 'all' | 'mine' | 'pending' (moderators only)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const params = tab === 'mine' ? { mine: true } : tab === 'pending' ? { status: 'pending' } : {};
      const { data } = await researchApi.list(params);
      setItems(data.data.research);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load research');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [tab]);

  function openCreate() {
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await researchApi.create({
        ...form,
        keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        departmentId: user.departmentId?._id || user.departmentId,
      });
      setModalOpen(false);
      await loadItems();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not submit research');
    } finally {
      setSaving(false);
    }
  }

  async function handleReview(item, status) {
    try {
      await researchApi.review(item._id, { status });
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update review status');
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete research submission "${item.title}"?`)) return;
    try {
      await researchApi.remove(item._id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Research</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Student and staff research, reviewed before publishing.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Submit research
        </Button>
      </div>

      <div className="flex gap-1.5 mb-6 border-b border-[var(--color-paper-line)]">
        {['all', 'mine', ...(isModerator ? ['pending'] : [])].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[var(--color-terracotta)] text-[var(--color-terracotta)]' : 'border-transparent text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]'
            }`}
          >
            {t === 'mine' ? 'My submissions' : t === 'pending' ? 'Pending review' : 'All approved'}
          </button>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">Nothing here yet.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const status = STATUS_STYLE[item.status];
            const canEditDelete = isOwner(item, 'authorId', user._id) || isModerator;

            return (
              <Card key={item._id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-card)] bg-[var(--color-ink)]/5 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[var(--color-ink)]/60" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: status.color }}>
                          {status.label}
                        </span>
                        {item.publishedYear && <span className="text-xs text-[var(--color-ink)]/40">{item.publishedYear}</span>}
                      </div>
                      <h3 className="font-semibold text-[var(--color-ink)] mt-0.5 leading-snug">{item.title}</h3>
                      <p className="text-sm text-[var(--color-ink)]/65 mt-1 line-clamp-2 leading-relaxed">{item.abstractText}</p>
                      <p className="text-xs text-[var(--color-ink)]/40 mt-2">
                        By {item.authorId?.fullName || 'Unknown'} · {item.departmentId?.name}
                      </p>
                      {item.status === 'rejected' && item.rejectionReason && (
                        <p className="text-xs text-[var(--color-urgent)] mt-1.5">Reason: {item.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isModerator && item.status === 'pending' && (
                      <>
                        <button onClick={() => handleReview(item, 'approved')} className="p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft)]/10 rounded-md" aria-label="Approve">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleReview(item, 'rejected')} className="p-2 text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/10 rounded-md" aria-label="Reject">
                          <XIcon size={16} />
                        </button>
                      </>
                    )}
                    {canEditDelete && (
                      <button onClick={() => handleDelete(item)} className="p-2 text-[var(--color-ink)]/50 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit research">
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <Alert variant="info" className="mb-4">Your submission will be reviewed before it's visible to others.</Alert>
        <form onSubmit={handleSubmit}>
          <Field label="Title" htmlFor="title">
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Abstract" htmlFor="abstractText">
            <Textarea id="abstractText" rows={5} value={form.abstractText} onChange={(e) => setForm({ ...form, abstractText: e.target.value })} required />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Keywords (comma-separated)" htmlFor="keywords">
              <Input id="keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
            </Field>
            <Field label="Published year" htmlFor="publishedYear">
              <Input id="publishedYear" type="number" value={form.publishedYear} onChange={(e) => setForm({ ...form, publishedYear: e.target.value })} />
            </Field>
          </div>
          <Field label="File URL (optional)" htmlFor="fileUrl" hint="Link to a PDF hosted elsewhere">
            <Input id="fileUrl" type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
          </Field>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            Submit for review
          </Button>
        </form>
      </Modal>
    </div>
  );
}
