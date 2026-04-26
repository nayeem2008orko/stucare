import { useState, useEffect } from 'react';
import { plannerApi } from '../../api/planner';

const diffStyle = {
  easy:   { background: '#d1f5e0', color: '#1a7a3a' },
  medium: { background: '#fff0cc', color: '#8a6000' },
  hard:   { background: '#fde0e0', color: '#c0392b' },
};
const statusStyle = {
  pending:     { background: '#e8e8e8', color: '#4a4a4a' },
  in_progress: { background: '#dbeffe', color: '#1a5a9a' },
  completed:   { background: '#d1f5e0', color: '#1a7a3a' },
  missed:      { background: '#fde0e0', color: '#c0392b' },
};

const emptyForm = { title: '', subject: '', description: '', difficulty: 'medium', deadline: '', estimatedHours: 2 };

export default function Planner() {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [form,       setForm]       = useState(emptyForm);
  const minDate = new Date().toISOString().split('T')[0];

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    setLoading(true);
    try { const res = await plannerApi.getTasks(); setTasks(res.data.data.tasks); }
    catch { setError('Failed to load tasks.'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.subject || !form.deadline) { setError('Please fill in required fields.'); return; }
    setSubmitting(true); setError('');
    try {
      await plannerApi.createTask({ title: form.title, subject: form.subject, description: form.description, difficulty: form.difficulty, deadline: form.deadline, estimatedHours: form.estimatedHours });
      setForm(emptyForm); setShowForm(false); loadTasks();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create task.'); }
    finally { setSubmitting(false); }
  }

  async function markComplete(task) {
    try {
      await plannerApi.updateTask(task.id, { title: task.title, subject: task.subject, difficulty: task.difficulty, deadline: task.deadline.split('T')[0], estimatedHours: task.estimated_hours, status: 'completed', completed_hours: task.estimated_hours });
      loadTasks();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update task.'); }
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try { await plannerApi.deleteTask(id); loadTasks(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete task.'); }
  }

  function daysUntil(deadline) { return Math.ceil((new Date(deadline) - Date.now()) / 86400000); }

  const inputStyle = { background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>Study Planner</h2>
          <p className="mt-1" style={{ color: '#6b7a6b' }}>Manage your tasks and study goals.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          style={{ background: '#87CEFA', color: '#1a1a2e' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Task
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{ background: '#fde8e8', borderColor: '#f5a0a0', color: '#c0392b' }}>{error}</div>}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(135, 206, 250, 0.15)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-8 w-full max-w-lg border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
            <h3 className="text-lg font-semibold mb-6" style={{ color: '#1a1a2e' }}>Add New Task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Calculus Chapter 3"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border" style={inputStyle}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Subject *</label>
                  <input type="text" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} placeholder="e.g. Math"
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border" style={inputStyle}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Difficulty *</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border" style={inputStyle}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Deadline *</label>
                  <input type="date" value={form.deadline} min={minDate} onChange={e => setForm(f => ({...f, deadline: e.target.value}))}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border" style={inputStyle}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Estimated Hours *</label>
                  <input type="number" value={form.estimatedHours} min="0.5" max="100" step="0.5" onChange={e => setForm(f => ({...f, estimatedHours: parseFloat(e.target.value)}))}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border" style={inputStyle}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Optional notes..."
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border resize-none" style={inputStyle}/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 font-medium py-2.5 rounded-lg transition-colors border"
                  style={{ background: '#fff', borderColor: '#b0c4b0', color: '#4a5a4a' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: '#87CEFA', color: '#1a1a2e' }}>
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#87CEFA', borderTopColor: 'transparent' }}></div>
        </div>
      ) : !tasks.length ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
          <p style={{ color: '#6b7a6b' }}>No tasks yet. Add your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="rounded-xl p-5 flex items-center gap-4 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
              <div className="w-2 h-12 rounded-full flex-shrink-0" style={{
                background: task.status === 'completed' ? '#34a85a' : task.status === 'missed' ? '#e74c3c' : '#87CEFA'
              }}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium" style={{ color: task.status === 'completed' ? '#8a9a8a' : '#1a1a2e', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={diffStyle[task.difficulty]}>{task.difficulty}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={statusStyle[task.status]}>{task.status}</span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: '#6b7a6b' }}>{task.subject}</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs" style={{ color: '#8a9a8a' }}>
                    📅 {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span style={{ color: daysUntil(task.deadline) <= 3 ? '#e74c3c' : '#8a9a8a' }}> ({daysUntil(task.deadline)} days left)</span>
                  </p>
                  <p className="text-xs" style={{ color: '#8a9a8a' }}>⏱ {task.completed_hours}/{task.estimated_hours} hrs</p>
                </div>
                <div className="mt-2 h-1 rounded-full w-48" style={{ background: '#c8dcc6' }}>
                  <div className="h-1 rounded-full" style={{ width: `${Math.min((task.completed_hours / task.estimated_hours) * 100, 100)}%`, background: '#87CEFA' }}/>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.status !== 'completed' && (
                  <button onClick={() => markComplete(task)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                    style={{ background: '#d1f5e0', color: '#1a7a3a' }}>
                    ✓ Done
                  </button>
                )}
                <button onClick={() => deleteTask(task.id)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  style={{ background: '#fde0e0', color: '#c0392b' }}>
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
