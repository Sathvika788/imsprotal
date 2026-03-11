import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

const Badge = ({ children, variant = 'primary', size = 'sm' }: BadgeProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea15, #764ba215)',
      color: '#667eea',
      border: '1px solid #667eea30',
    },
    success: {
      background: '#dcfce7',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    },
    danger: {
      background: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
    warning: {
      background: '#fef3c7',
      color: '#d97706',
      border: '1px solid #fce7a7',
    },
    info: {
      background: '#e0f2fe',
      color: '#0ea5e9',
      border: '1px solid #bae6fd',
    },
  };

  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '11px' },
    md: { padding: '6px 12px', fontSize: '12px' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      ...variantStyles[variant],
      ...sizeStyles[size],
      borderRadius: '8px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

export default Badge;
