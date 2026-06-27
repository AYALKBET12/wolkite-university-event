import { useEffect, useState } from 'react';
import { CloudSun, Wind, Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { campusApi } from '../api/orgStructure';
import { weatherApi } from '../api/registrationsAndWeather';
import { Card, Alert } from '../components/Card';
import { Select } from '../components/FormFields';
import Button from '../components/Button';
import { ROLES } from '../utils/constants';

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function Weather() {
  const { user } = useAuth();
  const canPickCampus = user.role === ROLES.SUPER_ADMIN;

  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState(user.campusId?._id || user.campusId || '');
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (canPickCampus) {
      campusApi.list().then(({ data }) => setCampuses(data.data.campuses)).catch(() => setCampuses([]));
    }
  }, [canPickCampus]);

  async function loadWeather(force = false) {
    if (!campusId) return;
    force ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [currentRes, historyRes] = await Promise.all([
        weatherApi.getForCampus(campusId, force),
        weatherApi.history(campusId, 12),
      ]);
      setWeather(currentRes.data.data.weather);
      setHistory(historyRes.data.data.history);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load weather. The provider may not be configured yet.');
      setWeather(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]);

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Weather</h1>
          <p className="text-[var(--color-ink)]/60 text-sm mt-1">Current conditions for your campus.</p>
        </div>
        {canPickCampus && campuses.length > 0 && (
          <Select value={campusId} onChange={(e) => setCampusId(e.target.value)} className="w-auto">
            {campuses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        )}
      </div>

      {error && <Alert variant="warning" className="mb-5">{error}</Alert>}

      {loading ? (
        <div className="h-48 bg-black/5 rounded-[var(--radius-card)] animate-pulse" />
      ) : weather ? (
        <>
          <Card className="p-6 sm:p-8 bg-[var(--color-ink)] border-none text-white relative overflow-hidden mb-6">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <CloudSun size={56} className="text-[var(--color-gold)]" strokeWidth={1.5} />
                <div>
                  <p className="font-[var(--font-display)] text-5xl font-bold">{Math.round(weather.tempC)}°C</p>
                  <p className="text-white/70 capitalize mt-1">{weather.description || weather.condition}</p>
                  <p className="text-xs text-white/40 mt-1">Updated {formatTime(weather.fetchedAt)}</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-white/70">
                {weather.feelsLikeC != null && (
                  <div className="flex items-center gap-2"><Thermometer size={18} /> Feels like {Math.round(weather.feelsLikeC)}°C</div>
                )}
                {weather.humidity != null && (
                  <div className="flex items-center gap-2"><Droplets size={18} /> {weather.humidity}% humidity</div>
                )}
                {weather.windSpeed != null && (
                  <div className="flex items-center gap-2"><Wind size={18} /> {weather.windSpeed} m/s wind</div>
                )}
              </div>
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white hover:text-[var(--color-ink)]" onClick={() => loadWeather(true)} loading={refreshing}>
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          </Card>

          {history.length > 1 && (
            <div>
              <h2 className="font-[var(--font-display)] font-bold text-lg text-[var(--color-ink)] mb-3">Recent readings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {history.map((h) => (
                  <Card key={h._id} className="p-3 text-center">
                    <p className="text-xs text-[var(--color-ink)]/45">{formatTime(h.fetchedAt)}</p>
                    <p className="font-[var(--font-display)] font-bold text-xl text-[var(--color-ink)] mt-1">{Math.round(h.tempC)}°</p>
                    <p className="text-xs text-[var(--color-ink)]/55 capitalize mt-0.5">{h.condition}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="p-10 text-center text-[var(--color-ink)]/50">
          Weather isn't available right now.
        </Card>
      )}
    </div>
  );
}
