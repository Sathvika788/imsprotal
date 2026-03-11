import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  fullWidth = false,
  loading = false,
  type = 'button',
}: ButtonProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      border: 'none',
      hoverShadow: 'rgba(102, 126, 234, 0.3)',
    },
    secondary: {
      background: colors.bg.tertiary,
      color: colors.text.primary,
      border: `1px solid ${colors.border}`,
      hoverShadow: 'rgba(102, 126, 234, 0.1)',
    },
    danger: {
      background: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      hoverShadow: 'rgba(220, 38, 38, 0.2)',
    },
    success: {
      background: '#dcfce7',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
      hoverShadow: 'rgba(22, 163, 74, 0.2)',
    },
  };

  const sizeStyles = {
    sm: { padding: '8px 12px', fontSize: '12px' },
    md: { padding: '11px 16px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '15px' },
  };

  const style = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
    borderRadius: '12px',
    fontWeight: '600',
    letterSpacing: '-0.3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 16px ${variantStyles[variant].hoverShadow}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={style as React.CSSProperties}
    >
      {loading && (
        <span style={{
          display: 'inline-block',
          width: '14px',
          height: '14px',
          border: '2px solid',
          borderColor: 'currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {children}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
