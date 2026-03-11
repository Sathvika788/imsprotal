import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
}

const StatCard = ({ title, value, icon, trend, color = '#667eea' }: StatCardProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{
      background: colors.card,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 4px 16px ${colors.shadow}`,
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: '600',
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}>
            {title}
          </p>
        </div>
        {icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <h2 style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: '800',
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px',
        }}>
          {value}
        </h2>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: '600',
            color: trend >= 0 ? '#16a34a' : '#dc2626',
          }}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
