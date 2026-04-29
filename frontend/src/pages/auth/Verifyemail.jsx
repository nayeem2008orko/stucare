import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  // userId and email come either from navigation state (after register)
  // or from query params (if 403 kicked them here from client.js interceptor)
  const params = new URLSearchParams(location.search);
  const userId = location.state?.userId || params.get('userId');
  const email  = location.state?.email  || '';

  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // If no userId at all, they shouldn't be here
  useEffect(() => {
    if (!userId) navigate('/register', { replace: true });
  }, [userId]);

  // Resend cooldown countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleDigitChange(index, value) {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === 5) {
      const otp = [...next].join('');
      if (otp.length === 6) submitOTP(otp);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    if (pasted.length === 6) {
      setTimeout(() => submitOTP(pasted), 50);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  async function submitOTP(otp) {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOTP(userId, otp);
      localStorage.setItem('stucare_access_token',  res.data.data.tokens.accessToken);
      localStorage.setItem('stucare_refresh_token', res.data.data.tokens.refreshToken);
      localStorage.setItem('stucare_user',          JSON.stringify(res.data.data.user));
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleVerify() {
    const otp = digits.join('');
    if (otp.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    submitOTP(otp);
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await authApi.resendOTP(userId);
      setSuccess('A new code has been sent to your email.');
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFEDCE' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a1a2e' }}>
            <span style={{ color: '#3a9ad9' }}>Stu</span>Care
          </h1>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: '#E5EEE4', borderColor: '#c8dcc6' }}>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>Verify your email</h2>
            <p className="text-sm mt-2" style={{ color: '#6b7a6b' }}>
              We sent a 6-digit code to{' '}
              <span className="font-medium" style={{ color: '#1a1a2e' }}>
                {email || 'your email address'}
              </span>
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{ background: '#fde8e8', borderColor: '#f5a0a0', color: '#c0392b' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm border" style={{ background: '#e8fdf0', borderColor: '#a0f0b0', color: '#1a7a3a' }}>
              {success}
            </div>
          )}

          {/* OTP digit inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-11 h-14 text-center text-xl font-bold rounded-lg border focus:outline-none transition-colors"
                style={{
                  background:   '#fff',
                  borderColor:  digit ? '#87CEFA' : '#b0c4b0',
                  color:        '#1a1a2e',
                  boxShadow:    digit ? '0 0 0 2px #87CEFA44' : 'none',
                }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || digits.join('').length < 6}
            className="w-full font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: '#87CEFA', color: '#1a1a2e' }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend */}
          <div className="text-center mt-5">
            <p className="text-sm" style={{ color: '#6b7a6b' }}>
              Didn't receive the code?{' '}
              {countdown > 0 ? (
                <span style={{ color: '#8a9a8a' }}>Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium disabled:opacity-50"
                  style={{ color: '#3a9ad9' }}
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </p>
          </div>

          {/* Wrong email */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => { localStorage.clear(); navigate('/register', { replace: true }); }}
              className="text-xs"
              style={{ color: '#8a9a8a' }}
            >
              Wrong email? Start over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}