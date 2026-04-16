import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { plannerApi } from "../../api/planner";
import { analyticsApi } from "../../api/analytics";

const diffClass = {
  easy: "bg-emerald-900 text-emerald-300",
  medium: "bg-amber-900 text-amber-300",
  hard: "bg-red-900 text-red-300",
};

export default function Dashboard() {
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availHours, setAvailHours] = useState(4);

  const user = JSON.parse(localStorage.getItem("stucare_user") || "{}");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [planRes, progressRes, streakRes] = await Promise.all([
        plannerApi.getDailyPlan(availHours),
        analyticsApi.getProgress(),
        analyticsApi.getStreak(),
      ]);
      setPlan(planRes.data.data);
      setProgress(progressRes.data.data);
      setStreak(streakRes.data.data);
    } catch (err) {
      setError("Could not load dashboard. Make sure all services are running.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await plannerApi.getDailyPlan(availHours);
      setPlan(res.data.data);
    } catch {
      setError("Could not generate plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">
          {greeting}, {user.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-gray-400 mt-1">
          Here's your study overview for today.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Completion Rate",
            value: `${progress?.completionRate ?? 0}%`,
            sub: null,
            bar: progress?.completionRate ?? 0,
          },
          {
            label: "Tasks Done",
            value: progress?.completedTasks ?? 0,
            sub: `of ${progress?.totalTasks ?? 0} total`,
          },
          {
            label: "Hours Studied",
            value: `${(progress?.totalHoursStudied ?? 0).toFixed(1)}`,
            sub: `of ${(progress?.totalHoursPlanned ?? 0).toFixed(1)} planned`,
          },
          {
            label: "Study Streak 🔥",
            value: streak?.currentStreak ?? 0,
            sub: `best: ${streak?.longestStreak ?? 0} days`,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            {stat.sub && (
              <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
            )}
            {stat.bar !== undefined && (
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full">
                <div
                  className="h-1.5 bg-indigo-500 rounded-full"
                  style={{ width: `${stat.bar}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Today's Study Plan
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Available hours:</label>
            <select
              value={availHours}
              onChange={(e) => setAvailHours(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                <option key={h} value={h}>
                  {h} hrs
                </option>
              ))}
            </select>
            <button
              onClick={regenerate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-3 text-sm">
              Generating your personalized plan...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={loadAll}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Try again
            </button>
          </div>
        ) : !plan?.schedule?.length ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-300 font-medium">
              No tasks scheduled for today
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Add subjects in the Planner to generate a study plan
            </p>
            <Link
              to="/planner"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Go to Planner
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.schedule.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors"
              >
                <div className="text-center min-w-[70px]">
                  <p className="text-indigo-400 font-semibold text-sm">
                    {item.start_time}
                  </p>
                  <p className="text-gray-500 text-xs">{item.end_time}</p>
                </div>
                <div className="w-px h-10 bg-gray-700"></div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${diffClass[item.difficulty]}`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="text-gray-300 text-sm font-medium">
                    {item.duration_min}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
