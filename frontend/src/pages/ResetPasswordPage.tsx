import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getThemeColors } from '../context/ThemeContext';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div
        style={{ background: colors.background }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div
          style={{ background: colors.cardBg, borderColor: colors.border }}
          className="w-full max-w-md p-8 rounded-lg border"
        >
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <Logo variant="icon" size="md" />
            </div>
            <h1 style={{ color: colors.text.primary }} className="text-2xl font-bold">
              Invalid Reset Link
            </h1>
          </div>
          <p style={{ color: colors.text.secondary }} className="text-center mb-6">
            The password reset link is invalid or expired. Please request a new one.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: colors.background }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div
        style={{ background: colors.cardBg, borderColor: colors.border }}
        className="w-full max-w-md p-8 rounded-lg border"
      >
        {success ? (
          <>
            <div className="text-center mb-6">
              <div
                style={{ background: colors.success + '20' }}
                className="inline-block p-4 rounded-full mb-4"
              >
                <div
                  style={{ color: colors.success }}
                  className="text-3xl"
                >
                  ✓
                </div>
              </div>
              <h1 style={{ color: colors.text.primary }} className="text-2xl font-bold">
                Password Reset Successful!
              </h1>
            </div>
            <p style={{ color: colors.text.secondary }} className="text-center mb-6">
              Your password has been reset. Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{ color: colors.primary }}
              className="mb-6 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={18} />
              <span>Back to Login</span>
            </button>

            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <Logo variant="icon" size="md" />
              </div>
              <h1 style={{ color: colors.text.primary }} className="text-2xl font-bold">
                Reset Your Password
              </h1>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div
                  style={{
                    background: colors.danger + '20',
                    borderColor: colors.danger,
                    color: colors.danger
                  }}
                  className="p-4 rounded border text-sm"
                >
                  {error}
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>

            <p
              style={{ color: colors.text.secondary }}
              className="text-center text-sm mt-6"
            >
              Password must be at least 6 characters long
            </p>
          </>
        )}
      </div>
    </div>
  );
}
