import { useState, useEffect } from "react";
import { plannerApi } from "../../api/planner";

const diffClass = {
  easy: "bg-emerald-900 text-emerald-300",
  medium: "bg-amber-900 text-amber-300",
  hard: "bg-red-900 text-red-300",
};

const statusClass = {
  pending: "bg-gray-800 text-gray-300",
  in_progress: "bg-blue-900 text-blue-300",
  completed: "bg-emerald-900 text-emerald-300",
  missed: "bg-red-900 text-red-300",
};

const emptyForm = {
  title: "",
  subject: "",
  description: "",
  difficulty: "medium",
  deadline: "",
  estimatedHours: 2,
};

export default function Planner() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const minDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await plannerApi.getTasks();
      setTasks(res.data.data.tasks);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.subject || !form.deadline) {
      setError("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await plannerApi.createTask({
        title: form.title,
        subject: form.subject,
        description: form.description,
        difficulty: form.difficulty,
        deadline: form.deadline,
        estimatedHours: form.estimatedHours,
      });
      setForm(emptyForm);
      setShowForm(false);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markComplete(task) {
    try {
      await plannerApi.updateTask(task.id, {
        status: "completed",
        completed_hours: task.estimated_hours,
      });
      loadTasks();
    } catch {}
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    try {
      await plannerApi.deleteTask(id);
      loadTasks();
    } catch {}
  }

  function daysUntil(deadline) {
    return Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Study Planner</h2>
          <p className="text-gray-400 mt-1">
            Manage your tasks and study goals.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Task
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-6">
              Add New Task
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Calculus Chapter 3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                    placeholder="e.g. Math"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Difficulty *
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, difficulty: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    min={minDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Estimated Hours *
                  </label>
                  <input
                    type="number"
                    value={form.estimatedHours}
                    min="0.5"
                    max="100"
                    step="0.5"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimatedHours: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !tasks.length ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400">
            No tasks yet. Add your first task to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4"
            >
              <div
                className={`w-2 h-12 rounded-full flex-shrink-0 ${
                  task.status === "completed"
                    ? "bg-emerald-500"
                    : task.status === "missed"
                      ? "bg-red-500"
                      : "bg-indigo-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-white font-medium ${task.status === "completed" ? "line-through text-gray-500" : ""}`}
                  >
                    {task.title}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${diffClass[task.difficulty]}`}
                  >
                    {task.difficulty}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusClass[task.status]}`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">{task.subject}</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-500 text-xs">
                    📅{" "}
                    {new Date(task.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <span
                      className={
                        daysUntil(task.deadline) <= 3
                          ? " text-red-400"
                          : " text-gray-500"
                      }
                    >
                      {" "}
                      ({daysUntil(task.deadline)} days left)
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    ⏱ {task.completed_hours}/{task.estimated_hours} hrs
                  </p>
                </div>
                <div className="mt-2 h-1 bg-gray-800 rounded-full w-48">
                  <div
                    className="h-1 bg-indigo-500 rounded-full"
                    style={{
                      width: `${Math.min((task.completed_hours / task.estimated_hours) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.status !== "completed" && (
                  <button
                    onClick={() => markComplete(task)}
                    className="text-xs bg-emerald-900/50 hover:bg-emerald-900 text-emerald-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✓ Done
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
