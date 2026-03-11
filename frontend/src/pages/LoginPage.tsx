import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';
import { Button, Input } from '../components/common';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setAuth(res.data.access_token, res.data.user);
      toast.success('Welcome back!');
      if (res.data.user.role === 'ceo') navigate('/ceo');
      else if (res.data.user.role === 'manager') navigate('/manager');
      else navigate('/intern');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      toast.success('Password reset link sent to your email!');
      setResetEmail('');
      setShowResetForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send reset link');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: colors.bg.secondary,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left Panel - Branded */}
      <div style={{
        width: '50%',
        background: `linear-gradient(135deg, #1F4F78 0%, #20B2AA 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 48px',
        flexShrink: 0,
        '@media (max-width: 1024px)': {
          display: 'none',
        },
      }}>
        <div>
          <Logo size="lg" showText variant="vertical" />
          <h2 style={{
            margin: '48px 0 20px',
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
          }}>
            Welcome to IMS
          </h2>
          <p style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '15px',
            lineHeight: 1.7,
            maxWidth: '380px',
          }}>
            Manage interns efficiently. Track attendance, work logs, tasks, expenses, and stipends all in one integrated platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '16px',
        }}>
          {[
            { icon: '👥', title: 'For Interns', desc: 'Log work, submit tasks' },
            { icon: '📊', title: 'For Managers', desc: 'Review & approve' },
            { icon: '📈', title: 'For CEO', desc: 'Analytics & insights' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: '20px', marginTop: '2px' }}>{item.icon}</div>
              <div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#fff',
                  letterSpacing: '0.3px',
                }}>
                  {item.title}
                </p>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        minWidth: 0,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
        }}>
          {/* Mobile Logo */}
          <div style={{
            display: 'none',
            marginBottom: '32px',
            '@media (max-width: 1024px)': {
              display: 'flex',
              justifyContent: 'center',
            },
          }}>
            <Logo size="md" showText />
          </div>

          {!showResetForm ? (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #1F4F78 0%, #20B2AA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}>
                  Sign In
                </h1>
                <p style={{
                  margin: '8px 0 0',
                  color: colors.text.secondary,
                  fontSize: '14px',
                }}>
                  Enter your credentials to access the system
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  error={errors.email}
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#20B2AA',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1F4F78'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#20B2AA'}
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  type="submit"
                  loading={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #1F4F78 0%, #20B2AA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}>
                  Reset Password
                </h1>
                <p style={{
                  margin: '8px 0 0',
                  color: colors.text.secondary,
                  fontSize: '14px',
                }}>
                  Enter your email to receive a password reset link
                </p>
              </div>

              <form onSubmit={handleForgotPassword} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetEmail('');
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    type="submit"
                    loading={resetLoading}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;