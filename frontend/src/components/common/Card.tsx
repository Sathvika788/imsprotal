import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card = ({ 
  children, 
  title, 
  subtitle, 
  padding = '24px',
  onClick,
  hover = true,
}: CardProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: '16px',
        padding,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 16px ${colors.shadow}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        transform: hover && onClick ? 'translateY(0)' : 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        if (hover && onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 12px 24px ${colors.shadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (hover && onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${colors.shadow}`;
        }
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: '16px' }}>
          {title && (
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: colors.text.primary,
              letterSpacing: '-0.3px',
            }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: colors.text.secondary,
              fontWeight: '500',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div style={{ color: colors.text.primary }}>
        {children}
      </div>
    </div>
  );
};

export default Card;
