import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusApi, collegeApi, departmentApi } from '../api/orgStructure';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Card';
import { Field, Input, Select } from '../components/FormFields';
import Button from '../components/Button';
import { SELF_REGISTERABLE_ROLES, ROLE_LABELS } from '../utils/constants';

const initialForm = {
  fullName: '',
  universityId: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  role: 'student',
  campusId: '',
  collegeId: '',
  departmentId: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [campuses, setCampuses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCampuses, setLoadingCampuses] = useState(true);

  // Public campus/college/department lists - these don't require auth,
  // since a person filling out this form has no account yet.
  useEffect(() => {
    async function loadCampuses() {
      try {
        const { data } = await campusApi.listPublic();
        setCampuses(data.data.campuses);
      } catch {
        setCampuses([]);
      } finally {
        setLoadingCampuses(false);
      }
    }
    loadCampuses();
  }, []);

  useEffect(() => {
    if (!form.campusId) {
      setColleges([]);
      return;
    }
    collegeApi.listPublic({ campusId: form.campusId }).then(({ data }) => setColleges(data.data.colleges));
  }, [form.campusId]);

  useEffect(() => {
    if (!form.collegeId) {
      setDepartments([]);
      return;
    }
    departmentApi.listPublic({ collegeId: form.collegeId }).then(({ data }) => setDepartments(data.data.departments));
  }, [form.collegeId]);

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'campusId') {
        next.collegeId = '';
        next.departmentId = '';
      }
      if (field === 'collegeId') {
        next.departmentId = '';
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!form.campusId) {
      setError('Please select your campus');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        universityId: form.universityId,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        campusId: form.campusId,
        collegeId: form.collegeId || undefined,
        departmentId: form.departmentId || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-parchment)] p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-ink-soft)]/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[var(--color-ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
            Registration submitted
          </h1>
          <p className="text-[var(--color-ink)]/70 mt-2 leading-relaxed">
            Your account is pending approval from your campus administrator.
            You'll be able to sign in once it's approved.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-6">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-parchment)] py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <p className="font-[var(--font-display)] text-xs font-semibold tracking-widest uppercase text-[var(--color-terracotta)] text-center">
          Wolkite University
        </p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-ink)] text-center mt-2">
          Create your account
        </h1>
        <p className="text-sm text-[var(--color-ink)]/60 text-center mt-1 mb-8">
          Registrations are reviewed by your campus admin before you can sign in.
        </p>

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-[var(--radius-card)] border border-[var(--color-paper-line)] p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Full name" htmlFor="fullName">
              <Input id="fullName" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
            </Field>
            <Field label="University ID" htmlFor="universityId">
              <Input id="universityId" value={form.universityId} onChange={(e) => update('universityId', e.target.value)} required />
            </Field>
          </div>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="you@wolkiteuniversity.edu.et"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </Field>

          <Field label="Phone (optional)" htmlFor="phone">
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Password" htmlFor="password" hint="At least 8 characters">
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="I am registering as" htmlFor="role">
            <Select id="role" value={form.role} onChange={(e) => update('role', e.target.value)}>
              {SELF_REGISTERABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </Field>

          <hr className="my-5 border-[var(--color-paper-line)]" />

          <Field label="Campus" htmlFor="campusId">
            <Select
              id="campusId"
              value={form.campusId}
              onChange={(e) => update('campusId', e.target.value)}
              required
            >
              <option value="">{loadingCampuses ? 'Loading campuses…' : 'Select your campus'}</option>
              {campuses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="College" htmlFor="collegeId" hint={!form.campusId ? 'Select a campus first' : undefined}>
              <Select
                id="collegeId"
                value={form.collegeId}
                onChange={(e) => update('collegeId', e.target.value)}
                disabled={!form.campusId}
              >
                <option value="">Select college</option>
                {colleges.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Department" htmlFor="departmentId" hint={!form.collegeId ? 'Select a college first' : undefined}>
              <Select
                id="departmentId"
                value={form.departmentId}
                onChange={(e) => update('departmentId', e.target.value)}
                disabled={!form.collegeId}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Button type="submit" className="w-full mt-3" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-sm text-[var(--color-ink)]/70 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-terracotta)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
