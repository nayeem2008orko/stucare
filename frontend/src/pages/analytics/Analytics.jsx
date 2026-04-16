import { useState, useEffect } from "react";
import { analyticsApi } from "../../api/analytics";
import { plannerApi } from "../../api/planner";

const diffClass = {
  easy: "bg-emerald-900 text-emerald-300",
  medium: "bg-amber-900 text-amber-300",
  hard: "bg-red-900 text-red-300",
};

export default function Analytics() {
  const [progress, setProgress] = useState(null);
  const [streak, setStreak] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getProgress(),
      analyticsApi.getStreak(),
      plannerApi.getTasks(),
    ])
      .then(([p, s, t]) => {
        setProgress(p.data.data);
        setStreak(s.data.data);
        setTasks(t.data.data.tasks);
      })
      .finally(() => setLoading(false));
  }, []);

  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  const hoursPercent =
    progress?.totalHoursPlanned > 0
      ? Math.min(
          (progress.totalHoursStudied / progress.totalHoursPlanned) * 100,
          100,
        )
      : 0;

  const circumference = 314;
  const dashOffset =
    circumference - (circumference * (progress?.completionRate ?? 0)) / 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400 mt-1">
          Track your study progress and performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Circle progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-4">Overall Progress</p>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {progress?.completionRate ?? 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Completed</span>
              <span className="text-emerald-400">
                {progress?.completedTasks ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">In Progress</span>
              <span className="text-blue-400">
                {progress?.inProgressTasks ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Missed</span>
              <span className="text-red-400">{progress?.missedTasks ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Study Hours</p>
          <p className="text-4xl font-bold text-white">
            {(progress?.totalHoursStudied ?? 0).toFixed(1)}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            of {(progress?.totalHoursPlanned ?? 0).toFixed(1)} planned hours
          </p>
          <div className="mt-4 h-2 bg-gray-800 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${hoursPercent}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Study Streak 🔥</p>
          <p className="text-4xl font-bold text-white">
            {streak?.currentStreak ?? 0}
          </p>
          <p className="text-gray-500 text-sm mt-1">consecutive days</p>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Longest streak</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {streak?.longestStreak ?? 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Task breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            Completed Tasks ({completed.length})
          </h3>
          {!completed.length ? (
            <p className="text-gray-500 text-sm">No completed tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {completed.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <p className="text-gray-200 text-sm font-medium">
                      {task.title}
                    </p>
                    <p className="text-gray-500 text-xs">{task.subject}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${diffClass[task.difficulty]}`}
                  >
                    {task.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            Pending Tasks ({pending.length})
          </h3>
          {!pending.length ? (
            <p className="text-gray-500 text-sm">
              No pending tasks. Great job!
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <p className="text-gray-200 text-sm font-medium">
                      {task.title}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {task.subject} · Due{" "}
                      {new Date(task.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${diffClass[task.difficulty]}`}
                  >
                    {task.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
