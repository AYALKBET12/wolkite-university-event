import { useEffect, useState } from 'react';
import { Plus, MapPin, Users, Trash2, Pencil, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/events';
import { registrationApi } from '../api/registrationsAndWeather';
import { Card, Alert } from '../components/Card';
import { Field, Input, Textarea, Select } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import CategoryTag from '../components/CategoryTag';
import { EVENT_CATEGORIES, VISIBILITY_OPTIONS } from '../utils/constants';
import { canManageContent, isOwner } from '../utils/permissions';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function categoryLabel(value) {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

const emptyForm = {
  title: '',
  description: '',
  category: 'academic',
  startsAt: '',
  endsAt: '',
  location: '',
  visibility: 'department_only',
  capacity: '',
};

export default function Events() {
  const { user } = useAuth();
  const canCreate = canManageContent(user.role);

  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState({}); // eventId -> registrationId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [registeringId, setRegisteringId] = useState(null);

  async function loadEvents() {
    setLoading(true);
    try {
      const { data } = await eventApi.list({ limit: 50, from: new Date().toISOString() });
      setEvents(data.data.events);
      setError('');

      try {
        const regsRes = await registrationApi.myRegistrations();
        const map = {};
        regsRes.data.data.registrations.forEach((r) => {
          if (r.status === 'registered') map[r.eventId._id || r.eventId] = r._id;
        });
        setMyRegistrations(map);
      } catch {
        setMyRegistrations({});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(event) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      category: event.category,
      startsAt: event.startsAt.slice(0, 16),
      endsAt: event.endsAt.slice(0, 16),
      location: event.location || '',
      visibility: event.visibility,
      capacity: event.capacity ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, capacity: form.capacity === '' ? null : Number(form.capacity) };
      if (editing) {
        await eventApi.update(editing._id, payload);
      } else {
        await eventApi.create(payload);
      }
      setModalOpen(false);
      await loadEvents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event) {
    if (!confirm(`Delete event "${event.title}"? This cannot be undone.`)) return;
    try {
      await eventApi.remove(event._id);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete event');
    }
  }

  async function handleRegister(event) {
    setRegisteringId(event._id);
    try {
      const { data } = await registrationApi.register(event._id);
      setMyRegistrations((prev) => ({ ...prev, [event._id]: data.data.registration._id }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not register for this event');
    } finally {
      setRegisteringId(null);
    }
  }

  async function handleCancelRegistration(event) {
    const regId = myRegistrations[event._id];
    if (!regId) return;
    setRegisteringId(event._id);
    try {
      await registrationApi.cancel(regId);
      setMyRegistrations((prev) => {
        const next = { ...prev };
        delete next[event._id];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel registration');
    } finally {
      setRegisteringId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Events</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Tech fairs, exams, movie nights, and everything in between.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Create event
          </Button>
        )}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">No upcoming events.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const canEdit =
              canManageContent(user.role) &&
              (isOwner(event, 'createdBy', user._id) || ['super_admin', 'campus_admin', 'dept_head'].includes(user.role));
            const isRegistered = !!myRegistrations[event._id];

            return (
              <Card key={event._id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <CategoryTag category={event.category} label={categoryLabel(event.category)} />
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(event)} className="p-1.5 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] hover:bg-black/5 rounded-md" aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(event)} className="p-1.5 text-[var(--color-ink)]/40 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-[var(--color-ink)] mt-2.5 leading-snug">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-[var(--color-ink)]/60 mt-1.5 line-clamp-2 leading-relaxed flex-1">{event.description}</p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-[var(--color-ink)]/55">
                  <p>{formatDateTime(event.startsAt)}</p>
                  {event.location && (
                    <p className="flex items-center gap-1"><MapPin size={12} /> {event.location}</p>
                  )}
                  {event.capacity != null && (
                    <p className="flex items-center gap-1"><Users size={12} /> Limited to {event.capacity} attendees</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-paper-line)]">
                  {isRegistered ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      loading={registeringId === event._id}
                      onClick={() => handleCancelRegistration(event)}
                    >
                      <Check size={14} /> Registered — cancel
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      loading={registeringId === event._id}
                      onClick={() => handleRegister(event)}
                      disabled={event.status === 'cancelled'}
                    >
                      Register
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit event' : 'Create event'} maxWidth="max-w-2xl">
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={handleSubmit}>
          <Field label="Title" htmlFor="title">
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" htmlFor="category">
              <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Visibility" htmlFor="visibility">
              <Select id="visibility" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                {VISIBILITY_OPTIONS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Starts at" htmlFor="startsAt">
              <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
            </Field>
            <Field label="Ends at" htmlFor="endsAt">
              <Input id="endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Location" htmlFor="location">
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Capacity (optional)" htmlFor="capacity">
              <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            {editing ? 'Save changes' : 'Create event'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
