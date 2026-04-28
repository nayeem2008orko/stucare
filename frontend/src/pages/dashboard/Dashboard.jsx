import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { plannerApi } from '../../api/planner';
import { analyticsApi } from '../../api/analytics';

const diffStyle = {
  easy:   { background: '#d1f5e0', color: '#1a7a3a' },
  medium: { background: '#fff0cc', color: '#8a6000' },
  hard:   { background: '#fde0e0', color: '#c0392b' },
};

export default function Dashboard() {
  const [plan,       setPlan]       = useState(null);
  const [progress,   setProgress]   = useState(null);
  const [streak,     setStreak]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [regen,      setRegen]      = useState(false);
  const [error,      setError]      = useState('');
  const [availHours, setAvailHours] = useState(
    () => Number(localStorage.getItem('stucare_avail_hours') || 4)
  );

  const user     = JSON.parse(localStorage.getItem('stucare_user') || '{}');
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Track last time we loaded so focus doesn't hammer the API
  const lastLoadRef = useRef(0);

  useEffect(() => {
    loadAll(availHours, false);
  }, []);

  // Soft-refresh when returning to tab — no force, just re-check completed tasks
  // Throttled to once per 30 seconds to avoid hammering the API
  useEffect(() => {
    function onFocus() {
      const now = Date.now();
      if (now - lastLoadRef.current > 30_000) {
        loadAll(availHours, false);
      }
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [availHours]);

  function handleHoursChange(h) {
    setAvailHours(h);
    localStorage.setItem('stucare_avail_hours', h);
  }

  async function loadAll(hours, force = false) {
    setLoading(true);
    setError('');
    lastLoadRef.current = Date.now();
    try {
      const [planRes, progressRes, streakRes] = await Promise.all([
        plannerApi.getDailyPlan(hours, force),
        analyticsApi.getProgress(),
        analyticsApi.getStreak(),
      ]);
      setPlan(planRes.data.data);
      setProgress(progressRes.data.data);
      setStreak(streakRes.data.data);
    } catch {
      setError('Could not load dashboard. Make sure all services are running.');
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setRegen(true);
    setError('');
    try {
      const res = await plannerApi.getDailyPlan(availHours, true);
      setPlan(res.data.data);
    } catch {
      setError('Could not regenerate plan. Please try again.');
    } finally {
      setRegen(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>
          {greeting}, {user.name?.split(' ')[0]}! 👋
        </h2>
        <p className="mt-1" style={{ color: '#6b7a6b' }}>Here's your study overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Completion Rate', value: `${progress?.completionRate ?? 0}%`,                                          bar: progress?.completionRate ?? 0 },
          { label: 'Tasks Done',      value: progress?.completedTasks ?? 0,        sub: `of ${progress?.totalTasks ?? 0} total` },
          { label: 'Hours Studied',   value: `${(progress?.totalHoursStudied ?? 0).toFixed(1)}h`, sub: `of ${(progress?.totalHoursPlanned ?? 0).toFixed(1)}h planned` },
          { label: 'Study Streak 🔥', value: streak?.currentStreak ?? 0,           sub: `best: ${streak?.longestStreak ?? 0} days` },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-5 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
            <p className="text-sm" style={{ color: '#6b7a6b' }}>{stat.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#1a1a2e' }}>{stat.value}</p>
            {stat.sub && <p className="text-xs mt-1" style={{ color: '#8a9a8a' }}>{stat.sub}</p>}
            {stat.bar !== undefined && (
              <div className="mt-2 h-1.5 rounded-full" style={{ background: '#c8dcc6' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${stat.bar}%`, background: '#87CEFA' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Daily Plan */}
      <div className="rounded-xl p-6 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>Today's Study Plan</h3>
            <p className="text-sm mt-0.5" style={{ color: '#8a9a8a' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {plan?.cached && <span className="ml-2 text-xs" style={{ color: '#b0b0b0' }}>(cached)</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm" style={{ color: '#6b7a6b' }}>Available hours:</label>
            <select
              value={availHours}
              onChange={e => handleHoursChange(Number(e.target.value))}
              className="rounded-lg px-3 py-1.5 text-sm focus:outline-none border"
              style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}
            >
              {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hr{h > 1 ? 's' : ''}</option>)}
            </select>
            <button
              type="button"
              onClick={regenerate}
              disabled={regen || loading}
              className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ background: '#87CEFA', color: '#1a1a2e' }}
            >
              {regen ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: '#87CEFA', borderTopColor: 'transparent' }} />
            <p className="mt-3 text-sm" style={{ color: '#6b7a6b' }}>Loading your plan...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>
            <button onClick={() => loadAll(availHours, false)} className="mt-3 text-sm" style={{ color: '#3a9ad9' }}>
              Try again
            </button>
          </div>
        ) : !plan?.schedule?.length ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="font-medium" style={{ color: '#1a1a2e' }}>No tasks scheduled for today</p>
            <p className="text-sm mt-1" style={{ color: '#6b7a6b' }}>
              Add tasks in the Planner then click Regenerate
            </p>
            <Link to="/planner"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#87CEFA', color: '#1a1a2e' }}>
              Go to Planner
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.schedule.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: '#fff', borderColor: '#c8dcc6' }}>
                <div className="text-center min-w-[70px]">
                  <p className="font-semibold text-sm" style={{ color: '#3a9ad9' }}>{item.start_time}</p>
                  <p className="text-xs" style={{ color: '#8a9a8a' }}>{item.end_time}</p>
                </div>
                <div className="w-px h-10" style={{ background: '#c8dcc6' }} />
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: '#1a1a2e' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7a6b' }}>{item.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={diffStyle[item.difficulty] || diffStyle.medium}>
                    {item.difficulty}
                  </span>
                  <span className="text-sm font-medium" style={{ color: '#1a1a2e' }}>{item.duration_min}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}