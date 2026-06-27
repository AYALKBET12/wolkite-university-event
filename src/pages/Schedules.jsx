import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { scheduleApi } from '../api/academics';
import { Card, Alert } from '../components/Card';
import { Field, Input, Select } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { DAYS_OF_WEEK } from '../utils/constants';
import { canManageContent } from '../utils/permissions';

const emptyForm = {
  courseName: '',
  courseCode: '',
  dayOfWeek: 'Monday',
  startTime: '08:00',
  endTime: '09:30',
  room: '',
  semester: '',
};

export default function Schedules() {
  const { user } = useAuth();
  const canCreate = canManageContent(user.role);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadSchedules() {
    setLoading(true);
    try {
      const { data } = await scheduleApi.list();
      setSchedules(data.data.schedules);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load schedules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(schedule) {
    setEditing(schedule);
    setForm({
      courseName: schedule.courseName,
      courseCode: schedule.courseCode || '',
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room || '',
      semester: schedule.semester || '',
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
        await scheduleApi.update(editing._id, form);
      } else {
        await scheduleApi.create({ ...form, departmentId: user.departmentId?._id || user.departmentId });
      }
      setModalOpen(false);
      await loadSchedules();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save schedule entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(schedule) {
    if (!confirm(`Remove "${schedule.courseName}" from the schedule?`)) return;
    try {
      await scheduleApi.remove(schedule._id);
      await loadSchedules();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete schedule entry');
    }
  }

  const byDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  if (!user.departmentId && !canManageContent(user.role)) {
    return (
      <Alert variant="warning">
        You're not assigned to a department yet, so no class schedule is available. Contact your campus admin.
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Class Schedule</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Weekly timetable for your department.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add class
          </Button>
        )}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day}>
              <h3 className="font-[var(--font-display)] font-bold text-sm text-[var(--color-ink)] uppercase tracking-wide mb-2.5 pb-2 border-b-2 border-[var(--color-terracotta)]">
                {day}
              </h3>
              {byDay[day].length === 0 ? (
                <p className="text-xs text-[var(--color-ink)]/35 py-3">No classes</p>
              ) : (
                <div className="space-y-2">
                  {byDay[day].map((s) => (
                    <Card key={s._id} className="p-3 group relative">
                      <p className="font-semibold text-sm text-[var(--color-ink)] leading-snug">{s.courseName}</p>
                      {s.courseCode && <p className="text-[11px] text-[var(--color-ink)]/45 font-medium">{s.courseCode}</p>}
                      <p className="text-xs text-[var(--color-ink)]/60 mt-1.5 flex items-center gap-1">
                        <Clock size={11} /> {s.startTime}–{s.endTime}
                      </p>
                      {s.room && (
                        <p className="text-xs text-[var(--color-ink)]/60 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {s.room}
                        </p>
                      )}
                      {canCreate && (
                        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(s)} className="p-1 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] hover:bg-black/5 rounded" aria-label="Edit">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(s)} className="p-1 text-[var(--color-ink)]/40 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded" aria-label="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit class' : 'Add class'}>
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Course name" htmlFor="courseName">
              <Input id="courseName" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} required />
            </Field>
            <Field label="Course code" htmlFor="courseCode">
              <Input id="courseCode" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} />
            </Field>
          </div>
          <Field label="Day" htmlFor="dayOfWeek">
            <Select id="dayOfWeek" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start time" htmlFor="startTime">
              <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </Field>
            <Field label="End time" htmlFor="endTime">
              <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Room" htmlFor="room">
              <Input id="room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </Field>
            <Field label="Semester" htmlFor="semester">
              <Input id="semester" placeholder="e.g. 2026 - Semester 2" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            {editing ? 'Save changes' : 'Add class'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
