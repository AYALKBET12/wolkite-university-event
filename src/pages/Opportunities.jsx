import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X as XIcon, Briefcase, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { internshipApi } from '../api/opportunities';
import { Card, Alert } from '../components/Card';
import { Field, Input, Textarea, Select } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { INTERNSHIP_TYPES } from '../utils/constants';
import { canModerate, isOwner } from '../utils/permissions';

const STATUS_STYLE = {
  pending: { label: 'Pending review', color: 'var(--color-gold)' },
  approved: { label: 'Approved', color: 'var(--color-ink-soft)' },
  rejected: { label: 'Rejected', color: 'var(--color-urgent)' },
};

const TYPE_LABEL = { internship: 'Internship', job: 'Job', volunteer: 'Volunteer' };

function formatDeadline(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyForm = {
  title: '',
  company: '',
  type: 'internship',
  description: '',
  location: '',
  isRemote: false,
  applyUrl: '',
  contactEmail: '',
  deadline: '',
};

export default function Opportunities() {
  const { user } = useAuth();
  const isModerator = canModerate(user.role);

  const [tab, setTab] = useState('all');
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
      const { data } = await internshipApi.list(params);
      setItems(data.data.internships);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load opportunities');
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
      await internshipApi.create({ ...form, deadline: form.deadline || undefined });
      setModalOpen(false);
      await loadItems();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not submit posting');
    } finally {
      setSaving(false);
    }
  }

  async function handleReview(item, status) {
    try {
      await internshipApi.review(item._id, { status });
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update review status');
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete posting "${item.title}"?`)) return;
    try {
      await internshipApi.remove(item._id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Internships &amp; Jobs</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Opportunities shared by students, staff, and partners.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Post opportunity
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
            {t === 'mine' ? 'My postings' : t === 'pending' ? 'Pending review' : 'All approved'}
          </button>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">Nothing here yet.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const status = STATUS_STYLE[item.status];
            const canEditDelete = isOwner(item, 'postedBy', user._id) || isModerator;

            return (
              <Card key={item._id} className="p-4 sm:p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-cat-internship)]/10 text-[var(--color-cat-internship)]">
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isModerator && item.status === 'pending' && (
                      <>
                        <button onClick={() => handleReview(item, 'approved')} className="p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft)]/10 rounded-md" aria-label="Approve">
                          <Check size={14} />
                        </button>
                        <button onClick={() => handleReview(item, 'rejected')} className="p-1.5 text-[var(--color-urgent)] hover:bg-[var(--color-urgent)]/10 rounded-md" aria-label="Reject">
                          <XIcon size={14} />
                        </button>
                      </>
                    )}
                    {canEditDelete && (
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-[var(--color-ink)]/40 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-[var(--color-ink)] mt-2.5 leading-snug flex items-center gap-1.5">
                  <Briefcase size={15} className="text-[var(--color-ink)]/40 shrink-0" />
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--color-ink)]/70 font-medium mt-0.5">{item.company}</p>
                <p className="text-sm text-[var(--color-ink)]/60 mt-2 line-clamp-2 leading-relaxed flex-1">{item.description}</p>

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--color-ink)]/55">
                  {(item.location || item.isRemote) && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {item.isRemote ? 'Remote' : item.location}</span>
                  )}
                  {item.deadline && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> Apply by {formatDeadline(item.deadline)}</span>
                  )}
                </div>

                {item.applyUrl && item.status === 'approved' && (
                  <a
                    href={item.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-terracotta)] hover:underline"
                  >
                    Apply <ExternalLink size={13} />
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post an opportunity" maxWidth="max-w-xl">
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <Alert variant="info" className="mb-4">Your posting will be reviewed before it's visible to others.</Alert>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title" htmlFor="title">
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Company / organization" htmlFor="company">
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </Field>
          </div>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type" htmlFor="type">
              <Select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {INTERNSHIP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Application deadline" htmlFor="deadline">
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Location" htmlFor="location">
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={form.isRemote} />
            </Field>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} className="w-4 h-4 accent-[var(--color-terracotta)]" />
                This is remote
              </label>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Apply URL" htmlFor="applyUrl">
              <Input id="applyUrl" type="url" value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} />
            </Field>
            <Field label="Contact email" htmlFor="contactEmail">
              <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            Submit for review
          </Button>
        </form>
      </Modal>
    </div>
  );
}
