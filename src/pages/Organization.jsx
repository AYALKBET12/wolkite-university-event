import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Building2, School, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { campusApi, collegeApi, departmentApi } from '../api/orgStructure';
import { Card, Alert } from '../components/Card';
import { Field, Input, Select } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { ROLES } from '../utils/constants';

export default function Organization() {
  const { user } = useAuth();
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  const [campuses, setCampuses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const { data } = await campusApi.list();
      setCampuses(data.data.campuses);
      if (data.data.campuses.length > 0 && !selectedCampus) {
        setSelectedCampus(data.data.campuses[0]._id);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load campuses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCampus) return;
    collegeApi.list({ campusId: selectedCampus }).then(({ data }) => {
      setColleges(data.data.colleges);
      setSelectedCollege(null);
      setDepartments([]);
    });
  }, [selectedCampus]);

  useEffect(() => {
    if (!selectedCollege) return;
    departmentApi.list({ collegeId: selectedCollege }).then(({ data }) => setDepartments(data.data.departments));
  }, [selectedCollege]);

  function openModal(type, item = null) {
    setModal(type);
    setEditing(item);
    setFormError('');
    if (type === 'campus') {
      setForm(
        item
          ? { name: item.name, location: item.location || '' }
          : { name: '', location: '', type: 'sub', parentCampusId: campuses.find((c) => c.type === 'main')?._id || '' }
      );
    } else if (type === 'college') {
      setForm(item ? { name: item.name, code: item.code || '' } : { name: '', code: '' });
    } else if (type === 'department') {
      setForm(item ? { name: item.name, code: item.code || '' } : { name: '', code: '' });
    }
  }

  async function refreshChildLists() {
    if (selectedCampus) {
      const { data } = await collegeApi.list({ campusId: selectedCampus });
      setColleges(data.data.colleges);
    }
    if (selectedCollege) {
      const { data } = await departmentApi.list({ collegeId: selectedCollege });
      setDepartments(data.data.departments);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'campus') {
        if (editing) await campusApi.update(editing._id, form);
        else await campusApi.create(form);
      } else if (modal === 'college') {
        if (editing) await collegeApi.update(editing._id, form);
        else await collegeApi.create({ ...form, campusId: selectedCampus });
      } else if (modal === 'department') {
        if (editing) await departmentApi.update(editing._id, form);
        else await departmentApi.create({ ...form, collegeId: selectedCollege });
      }
      setModal(null);
      await loadAll();
      await refreshChildLists();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type, item) {
    if (!confirm(`Delete "${item.name}"? This will fail if it still has dependents.`)) return;
    try {
      if (type === 'campus') await campusApi.remove(item._id);
      if (type === 'college') await collegeApi.remove(item._id);
      if (type === 'department') await departmentApi.remove(item._id);
      await loadAll();
      await refreshChildLists();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Campuses &amp; Departments</h1>
        <p className="text-[var(--color-ink)]/60 text-sm mt-1">Manage Wolkite University's organizational structure.</p>
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="h-64 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <ColumnPanel icon={Building2} title="Campuses" canAdd={isSuperAdmin} onAdd={() => openModal('campus')}>
            {campuses.map((c) => (
              <ListRow
                key={c._id}
                label={c.name}
                sublabel={c.type === 'main' ? 'Main campus' : 'Sub-campus'}
                active={selectedCampus === c._id}
                onClick={() => setSelectedCampus(c._id)}
                onEdit={() => openModal('campus', c)}
                onDelete={c.type !== 'main' ? () => handleDelete('campus', c) : undefined}
              />
            ))}
          </ColumnPanel>

          <ColumnPanel
            icon={School}
            title="Colleges"
            canAdd={!!selectedCampus}
            onAdd={() => openModal('college')}
            empty={!selectedCampus ? 'Select a campus' : colleges.length === 0 ? 'No colleges yet' : null}
          >
            {colleges.map((c) => (
              <ListRow
                key={c._id}
                label={c.name}
                sublabel={c.code}
                active={selectedCollege === c._id}
                onClick={() => setSelectedCollege(c._id)}
                onEdit={() => openModal('college', c)}
                onDelete={() => handleDelete('college', c)}
              />
            ))}
          </ColumnPanel>

          <ColumnPanel
            icon={BookOpen}
            title="Departments"
            canAdd={!!selectedCollege}
            onAdd={() => openModal('department')}
            empty={!selectedCollege ? 'Select a college' : departments.length === 0 ? 'No departments yet' : null}
          >
            {departments.map((d) => (
              <ListRow key={d._id} label={d.name} sublabel={d.code} onEdit={() => openModal('department', d)} onDelete={() => handleDelete('department', d)} />
            ))}
          </ColumnPanel>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={`${editing ? 'Edit' : 'Add'} ${modal || ''}`}>
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={handleSubmit}>
          <Field label="Name" htmlFor="name">
            <Input id="name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          {modal === 'campus' && (
            <>
              <Field label="Location" htmlFor="location">
                <Input id="location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              {!editing && (
                <Field label="Type" htmlFor="type">
                  <Select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="sub">Sub-campus</option>
                    <option value="main">Main campus</option>
                  </Select>
                </Field>
              )}
            </>
          )}
          {(modal === 'college' || modal === 'department') && (
            <Field label="Code" htmlFor="code">
              <Input id="code" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
          )}
          <Button type="submit" className="w-full mt-2" loading={saving}>
            {editing ? 'Save changes' : 'Create'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function ColumnPanel({ icon: Icon, title, canAdd, onAdd, empty, children }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm text-[var(--color-ink)] flex items-center gap-2">
          <Icon size={16} className="text-[var(--color-terracotta)]" /> {title}
        </h2>
        {canAdd && (
          <button onClick={onAdd} className="p-1.5 text-[var(--color-terracotta)] hover:bg-[var(--color-terracotta)]/10 rounded-md" aria-label={`Add ${title}`}>
            <Plus size={16} />
          </button>
        )}
      </div>
      <Card className="p-2 min-h-[200px]">
        {empty || !hasChildren ? (
          <p className="text-xs text-[var(--color-ink)]/40 text-center py-8">{empty || 'Nothing yet'}</p>
        ) : (
          <div className="space-y-1">{children}</div>
        )}
      </Card>
    </div>
  );
}

function ListRow({ label, sublabel, active, onClick, onEdit, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-card)] text-sm transition-colors ${
        active ? 'bg-[var(--color-terracotta)]/10' : onClick ? 'hover:bg-black/[0.035] cursor-pointer' : ''
      }`}
    >
      <div className="min-w-0">
        <p className={`font-medium truncate ${active ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-ink)]'}`}>{label}</p>
        {sublabel && <p className="text-xs text-[var(--color-ink)]/45">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] hover:bg-black/5 rounded-md" aria-label="Edit">
          <Pencil size={13} />
        </button>
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-[var(--color-ink)]/40 hover:text-[var(--color-urgent)] hover:bg-black/5 rounded-md" aria-label="Delete">
            <Trash2 size={13} />
          </button>
        )}
        {onClick && <ChevronRight size={14} className="text-[var(--color-ink)]/30 ml-0.5" />}
      </div>
    </div>
  );
}
