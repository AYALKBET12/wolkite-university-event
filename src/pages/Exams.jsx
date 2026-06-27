import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Clock, MapPin, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { examApi } from '../api/academics';
import { Card, Alert } from '../components/Card';
import { Field, Input, Select, Textarea } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { canManageContent } from '../utils/permissions';

const EXAM_TYPES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'makeup', label: 'Makeup' },
];

const emptyForm = {
  courseName: '',
  courseCode: '',
  examType: 'final',
  examDate: '',
  startTime: '',
  endTime: '',
  room: '',
  notes: '',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const EXAM_TYPE_COLOR = {
  quiz: 'var(--color-cat-academic)',
  midterm: 'var(--color-gold)',
  final: 'var(--color-cat-exam)',
  makeup: 'var(--color-cat-internship)',
};

export default function Exams() {
  const { user } = useAuth();
  const canCreate = canManageContent(user.role);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadExams() {
    setLoading(true);
    try {
      const { data } = await examApi.list();
      setExams(data.data.exams);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(exam) {
    setEditing(exam);
    setForm({
      courseName: exam.courseName,
      courseCode: exam.courseCode || '',
      examType: exam.examType,
      examDate: exam.examDate.slice(0, 10),
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      room: exam.room || '',
      notes: exam.notes || '',
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
        await examApi.update(editing._id, form);
      } else {
        await examApi.create({ ...form, departmentId: user.departmentId?._id || user.departmentId });
      }
      setModalOpen(false);
      await loadExams();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save exam');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exam) {
    if (!confirm(`Remove the exam for "${exam.courseName}"?`)) return;
    try {
      await examApi.remove(exam._id);
      await loadExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete exam');
    }
  }

  if (!user.departmentId && !canManageContent(user.role)) {
    return (
      <Alert variant="warning">
        You're not assigned to a department yet, so no exam schedule is available. Contact your campus admin.
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Exams</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Exam dates for your department.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Schedule exam
          </Button>
        )}
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}
        </div>
      ) : exams.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">No exams scheduled yet.</Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card key={exam._id} className="p-4 sm:p-5" style={{ borderLeftWidth: '4px', borderLeftColor: EXAM_TYPE_COLOR[exam.examType] }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${EXAM_TYPE_COLOR[exam.examType]}1A` }}
                  >
                    <GraduationCap size={18} style={{ color: EXAM_TYPE_COLOR[exam.examType] }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: EXAM_TYPE_COLOR[exam.examType] }}>
                      {exam.examType}
                    </span>
                    <h3 className="font-semibold text-[var(--color-ink)] leading-snug">
                      {exam.courseName} {exam.courseCode && <span className="text-[var(--color-ink)]/45">({exam.courseCode})</span>}
                    </h3>
                    <p className="text-sm text-[var(--color-ink)]/65 mt-1">{formatDate(exam.examDate)}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[var(--color-ink)]/55">
                      {exam.startTime && (
                        <span className="flex items-center gap-1"><Clock size={12} /> {exam.startTime}{exam.endTime && `–${exam.endTime}`}</span>
                      )}
                      {exam.room && <span className="flex items-center gap-1"><MapPin size={12} /> {exam.room}</span>}
                    </div>
                    {exam.notes && <p className="text-xs text-[var(--color-ink)]/55 mt-1.5">{exam.notes}</p>}
                  </div>
                </div>
                {canCreate && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(exam)} className="p-2 text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] hover:bg-black/5 rounded-md" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(exam)} className="p-2 text-[var(--color-ink)]/50 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit exam' : 'Schedule exam'}>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Exam type" htmlFor="examType">
              <Select id="examType" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                {EXAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Exam date" htmlFor="examDate">
              <Input id="examDate" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} required />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start time" htmlFor="startTime">
              <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Field>
            <Field label="End time" htmlFor="endTime">
              <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Room" htmlFor="room">
            <Input id="room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </Field>
          <Field label="Notes (optional)" htmlFor="notes">
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" className="w-full mt-2" loading={saving}>
            {editing ? 'Save changes' : 'Schedule exam'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
