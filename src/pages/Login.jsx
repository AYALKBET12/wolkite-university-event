import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Alert } from '../components/Card';
import { Field, Input } from '../components/FormFields';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: brand panel - the noticeboard thesis statement */}
      <div className="lg:w-1/2 bg-[var(--color-ink)] text-white relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10">
          <p className="font-[var(--font-display)] text-sm font-semibold tracking-widest uppercase text-[var(--color-gold)]">
            Wolkite University
          </p>
          <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold mt-3 leading-[1.1]">
            One noticeboard,<br />four campuses.
          </h1>
          <p className="mt-5 text-white/70 max-w-md leading-relaxed">
            Notices, exams, schedules, research, and every event from movie
            nights to tech fairs — across Main Campus, Engineering, Butajira
            Social Science, and Medicine &amp; Health.
          </p>
        </div>

        {/* Signature element: overlapping "pinned" category tags, like thumbtacked notices */}
        <div className="relative z-10 mt-12 flex flex-wrap gap-3">
          {[
            { label: 'Tech Fair', color: 'var(--color-cat-tech)', rotate: '-rotate-2' },
            { label: 'Final Exams', color: 'var(--color-cat-exam)', rotate: 'rotate-1' },
            { label: 'Movie Night', color: 'var(--color-cat-entertainment)', rotate: '-rotate-1' },
            { label: 'Internships', color: 'var(--color-cat-internship)', rotate: 'rotate-2' },
          ].map((tag) => (
            <span
              key={tag.label}
              className={`${tag.rotate} inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md px-3 py-1.5 text-xs font-semibold text-white/90`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right: login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[var(--color-parchment)]">
        <div className="w-full max-w-sm">
          <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
            Sign in
          </h2>
          <p className="text-sm text-[var(--color-ink)]/60 mt-1 mb-6">
            Use your university email to access your campus dashboard.
          </p>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@wolkiteuniversity.edu.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="text-sm text-[var(--color-ink)]/70 mt-6 text-center">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[var(--color-terracotta)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
