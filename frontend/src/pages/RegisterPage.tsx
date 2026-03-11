import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';
import { Button, Input, Badge } from '../components/common';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  useEffect(() => {
    if (code) {
      api.get(`/auth/invites/validate/${code}`)
        .then(res => setRole(res.data.role))
        .catch(() => toast.error('Invalid invite code'));
    }
  }, [code]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!name) newErrors.name = 'Name is required';
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
      const res = await api.post('/auth/register', { email, password, name, invite_code: code });
      setAuth(res.data.access_token, res.data.user);
      toast.success('Account created!');
      if (res.data.user.role === 'ceo') navigate('/ceo');
      else if (res.data.user.role === 'manager') navigate('/manager');
      else navigate('/intern');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roleAccent = role === 'intern' ? '#0ea5e9' : role === 'manager' ? '#6366f1' : '#f59e0b';
  const roleLight =
    role === 'intern' ? '#e0f2fe'
    : role === 'manager' ? '#ede9fe'
    : '#fef3c7';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bg.secondary,
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: colors.card,
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 12px 40px ${colors.shadow}`,
        padding: '48px',
        animation: 'fadeIn 0.5s ease-in',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px',
        }}>
          <Logo size="md" showText />
        </div>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #1F4F78 0%, #20B2AA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Create Account
          </h1>
          <p style={{
            margin: '8px 0 0',
            color: colors.text.secondary,
            fontSize: '14px',
          }}>
            Join the Intern Management System
          </p>
        </div>

        {/* Role Badge */}
        {role && (
          <div style={{
            marginBottom: '24px',
            padding: '14px 16px',
            background: roleLight,
            borderRadius: '12px',
            border: `1px solid ${roleAccent}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}>
                Registration Role
              </p>
              <p style={{
                margin: '4px 0 0',
                fontSize: '15px',
                fontWeight: '700',
                color: roleAccent,
                textTransform: 'capitalize',
              }}>
                {role}
              </p>
            </div>
            <Badge variant={
              role === 'intern' ? 'info'
              : role === 'manager' ? 'primary'
              : 'warning'
            }>
              ✓ Verified
            </Badge>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
          />

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

          <div style={{ marginTop: '8px' }}>
            <Button
              variant="primary"
              fullWidth
              type="submit"
              loading={loading}
              disabled={!role}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: colors.text.secondary,
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#20B2AA',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1F4F78'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#20B2AA'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          div { padding: 24px; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;