import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'icon' | 'horizontal' | 'vertical';
}

const Logo = ({ size = 'md', showText = true, variant = 'horizontal' }: LogoProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const sizeConfig = {
    sm: { wrapperSize: '40px', fontSize: '10px', gap: '6px', svgSize: 40 },
    md: { wrapperSize: '56px', fontSize: '12px', gap: '10px', svgSize: 56 },
    lg: { wrapperSize: '80px', fontSize: '14px', gap: '14px', svgSize: 80 },
  };

  const config = sizeConfig[size];

  const LogoSVG = (
    <svg
      width={config.svgSize}
      height={config.svgSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head - Intern/Person */}
      <circle cx="100" cy="55" r="20" fill="#1F4F78" />
      
      {/* Body - Torso */}
      <rect x="85" y="80" width="30" height="35" rx="4" fill="#20B2AA" />
      
      {/* Left Arm */}
      <rect x="50" y="85" width="35" height="8" rx="4" fill="#20B2AA" />
      
      {/* Right Arm */}
      <rect x="115" y="85" width="35" height="8" rx="4" fill="#20B2AA" />
      
      {/* Left Leg */}
      <rect x="80" y="120" width="10" height="40" rx="5" fill="#1F4F78" />
      
      {/* Right Leg */}
      <rect x="110" y="120" width="10" height="40" rx="5" fill="#1F4F78" />
      
      {/* Book - Learning Symbol */}
      <g opacity="0.9">
        <path
          d="M 140 65 L 160 55 L 160 85 L 140 95 Z"
          fill="#48D1CC"
          stroke="#20B2AA"
          strokeWidth="1.5"
        />
        <path
          d="M 140 65 L 140 95 L 160 85 L 160 55 Z"
          fill="#20B2AA"
          opacity="0.5"
        />
        {/* Book lines - text */}
        <line x1="145" y1="70" x2="155" y2="65" stroke="#1F4F78" strokeWidth="1" />
        <line x1="145" y1="77" x2="155" y2="72" stroke="#1F4F78" strokeWidth="1" />
        <line x1="145" y1="84" x2="155" y2="79" stroke="#1F4F78" strokeWidth="1" />
      </g>
      
      {/* Growth Arrow - Upward trajectory */}
      <g>
        <path
          d="M 35 140 L 45 120 L 50 125"
          stroke="#1F4F78"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="35" cy="140" r="2.5" fill="#1F4F78" />
      </g>
      
      {/* Star - Success/Achievement */}
      <g opacity="0.85">
        <path
          d="M 170 140 L 173 147 L 180 148 L 175 153 L 176 160 L 170 156 L 164 160 L 165 153 L 160 148 L 167 147 Z"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return LogoSVG;
  }

  if (variant === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: config.gap }}>
        {LogoSVG}
        {showText && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: config.fontSize === '10px' ? '11px' : config.fontSize === '12px' ? '14px' : '18px',
              fontWeight: '800',
              color: '#1F4F78',
              letterSpacing: '-0.5px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              IMS
            </div>
            {size !== 'sm' && (
              <div style={{
                fontSize: size === 'md' ? '9px' : '10px',
                fontWeight: '700',
                color: '#20B2AA',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontFamily: "'DM Sans', sans-serif",
                marginTop: '2px',
              }}>
                Intern Mgmt
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: config.gap,
    }}>
      {LogoSVG}

      {showText && (
        <div>
          <div style={{
            fontSize: config.fontSize === '10px' ? '12px' : config.fontSize === '12px' ? '16px' : '22px',
            fontWeight: '800',
            color: '#1F4F78',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
            lineHeight: 1,
          }}>
            IMS
          </div>
          {size !== 'sm' && (
            <div style={{
              fontSize: size === 'md' ? '10px' : '12px',
              fontWeight: '700',
              color: '#20B2AA',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              marginTop: '2px',
            }}>
              Intern Management
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
