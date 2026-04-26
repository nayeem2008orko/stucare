import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
 
export default function Register() {
  const [name,     setName]     = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();
 
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !username || !email || !password) { setError('Please fill in all fields.'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers, and underscores.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(name, username, email, password);
      localStorage.setItem('stucare_access_token',  res.data.data.tokens.accessToken);
      localStorage.setItem('stucare_refresh_token', res.data.data.tokens.refreshToken);
      localStorage.setItem('stucare_user',          JSON.stringify(res.data.data.user));
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFEDCE' }}>
      <div className="w-full max-w-md">
 
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>
            <span style={{ color: '#3a9ad9' }}>Stu</span>Care
          </h1>
          <p className="mt-2" style={{ color: '#6b7a6b' }}>Create your account and start studying smarter.</p>
        </div>
 
        <div className="rounded-2xl p-8 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>
 
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{ background: '#fde8e8', borderColor: '#f5a0a0', color: '#c0392b' }}>
              {error}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. john_doe"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}/>
              <p className="text-xs mt-1" style={{ color: '#8a9a8a' }}>Letters, numbers, and underscores only</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2c3e2c' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
                style={{ background: '#fff', borderColor: '#b0c4b0', color: '#1a1a2e' }}/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: '#87CEFA', color: '#1a1a2e' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
 
          <p className="text-center text-sm mt-6" style={{ color: '#6b7a6b' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#3a9ad9' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
