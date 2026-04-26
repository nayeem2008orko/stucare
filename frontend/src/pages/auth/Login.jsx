import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  async function handleSubmit() {
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('stucare_access_token',  res.data.data.tokens.accessToken);
      localStorage.setItem('stucare_refresh_token', res.data.data.tokens.refreshToken);
      localStorage.setItem('stucare_user',          JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFEDCE' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>
            <span style={{ color: '#3a9ad9' }}>Stu</span>Care
          </h1>
          <p className="mt-2" style={{ color: '#6b7a6b' }}>Welcome back! Sign in to continue.</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{ background: '#fde8e8', borderColor: '#f5a0a0', color: '#c0392b' }}>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey}
                placeholder="your_username"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}
              />
            </div>
            <button
              type="button" onClick={handleSubmit} disabled={loading}
              className="w-full font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: '#87CEFA', color: '#1a1a2e' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#6b7a6b' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#3a9ad9' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}