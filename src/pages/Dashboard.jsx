import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudSun, Wind, Droplets, ArrowRight, CalendarDays, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { noticeApi } from '../api/notices';
import { eventApi } from '../api/events';
import { weatherApi } from '../api/registrationsAndWeather';
import { Card, Alert } from '../components/Card';
import CategoryTag from '../components/CategoryTag';
import { EVENT_CATEGORIES } from '../utils/constants';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function categoryLabel(value) {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

// Deterministic small rotation per item so pinned notices look hand-pinned,
// not randomly jittering on every re-render.
function rotationFor(id) {
  const hash = String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const options = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];
  return options[hash % options.length];
}

export default function Dashboard() {
  const { user } = useAuth();

  const [pinnedNotices, setPinnedNotices] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [noticesRes, eventsRes] = await Promise.all([
          noticeApi.list({ limit: 5 }),
          eventApi.list({ limit: 5, from: new Date().toISOString() }),
        ]);

        if (cancelled) return;
        setPinnedNotices(noticesRes.data.data.notices);
        setUpcomingEvents(eventsRes.data.data.events);

        // Weather is best-effort: a misconfigured/unactivated key shouldn't
        // break the rest of the dashboard.
        const campusId = user.campusId?._id || user.campusId;
        if (campusId) {
          try {
            const weatherRes = await weatherApi.getForCampus(campusId);
            if (!cancelled) setWeather(weatherRes.data.data.weather);
          } catch {
            if (!cancelled) setWeather(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const firstName = user.fullName.split(' ')[0];

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
          Welcome back, {firstName}
        </h1>
        <p className="text-[var(--color-ink)]/60 mt-1">
          Here's what's pinned to the board across {user.campusId?.name || 'your campus'} today.
        </p>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pinned notices - the signature noticeboard element */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-display)] font-bold text-lg text-[var(--color-ink)] flex items-center gap-2">
              <Bell size={20} className="text-[var(--color-terracotta)]" />
              Pinned notices
            </h2>
            <Link to="/notices" className="text-sm font-semibold text-[var(--color-terracotta)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <SkeletonBoard />
          ) : pinnedNotices.length === 0 ? (
            <Card className="p-8 text-center text-[var(--color-ink)]/50">
              Nothing pinned right now. Check back soon.
            </Card>
          ) : (
            <div className="bg-[var(--color-ink)]/[0.03] rounded-[var(--radius-card)] p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
              {pinnedNotices.map((notice) => {
                const priorityColor =
                  notice.priority === 'urgent'
                    ? 'var(--color-urgent)'
                    : notice.priority === 'high'
                    ? 'var(--color-gold)'
                    : 'var(--color-ink)';
                return (
                  <div
                    key={notice._id}
                    className={`${rotationFor(notice._id)} bg-white rounded-[var(--radius-card)] border border-[var(--color-paper-line)] shadow-md p-4 hover:rotate-0 transition-transform duration-200`}
                    style={{ borderTopWidth: '3px', borderTopColor: priorityColor }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      {notice.priority !== 'normal' && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: priorityColor }}
                        >
                          {notice.priority}
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--color-ink)]/40 ml-auto">
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--color-ink)] text-sm leading-snug">{notice.title}</h3>
                    <p className="text-xs text-[var(--color-ink)]/60 mt-1.5 line-clamp-3 leading-relaxed">
                      {notice.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: weather + upcoming events */}
        <div className="space-y-6">
          <WeatherCard weather={weather} loading={loading} campusName={user.campusId?.name} />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[var(--font-display)] font-bold text-lg text-[var(--color-ink)] flex items-center gap-2">
                <CalendarDays size={20} className="text-[var(--color-terracotta)]" />
                Coming up
              </h2>
              <Link to="/events" className="text-sm font-semibold text-[var(--color-terracotta)] hover:underline flex items-center gap-1">
                All <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />)}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card className="p-5 text-sm text-[var(--color-ink)]/50">No upcoming events yet.</Card>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event._id} className="p-4">
                    <CategoryTag category={event.category} label={categoryLabel(event.category)} />
                    <h3 className="font-semibold text-[var(--color-ink)] text-sm mt-2 leading-snug">{event.title}</h3>
                    <p className="text-xs text-[var(--color-ink)]/55 mt-1">
                      {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherCard({ weather, loading, campusName }) {
  return (
    <Card className="p-5 bg-[var(--color-ink)] border-none text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
      />
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{campusName || 'Your campus'}</p>
        {loading ? (
          <div className="h-16 mt-2 bg-white/10 rounded animate-pulse" />
        ) : weather ? (
          <>
            <div className="flex items-center gap-3 mt-2">
              <CloudSun size={36} className="text-[var(--color-gold)]" strokeWidth={1.5} />
              <div>
                <p className="font-[var(--font-display)] text-3xl font-bold">{Math.round(weather.tempC)}°C</p>
                <p className="text-sm text-white/70 capitalize">{weather.description || weather.condition}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-white/60">
              {weather.humidity != null && (
                <span className="flex items-center gap-1"><Droplets size={14} /> {weather.humidity}%</span>
              )}
              {weather.windSpeed != null && (
                <span className="flex items-center gap-1"><Wind size={14} /> {weather.windSpeed} m/s</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-white/60 mt-2">Weather unavailable right now.</p>
        )}
      </div>
    </Card>
  );
}

function SkeletonBoard() {
  return (
    <div className="bg-[var(--color-ink)]/[0.03] rounded-[var(--radius-card)] p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-white rounded-[var(--radius-card)] border border-[var(--color-paper-line)] animate-pulse" />
      ))}
    </div>
  );
}
