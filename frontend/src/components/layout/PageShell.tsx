import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Logo from '../common/Logo';
import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface PageShellProps {
  children: React.ReactNode;
  title: string;
}

const PageShell = ({ children, title }: PageShellProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.bg.secondary,
    backgroundImage: theme === 'light' 
      ? 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%)'
      : 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.03) 0%, transparent 50%)',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background-color 0.3s ease',
  };

  const mainStyle = {
    marginLeft: isMobile ? 0 : '280px',
    flex: 1,
    padding: isMobile ? '20px 16px' : '40px 48px',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease, padding 0.3s ease',
  };

  const headerStyle = {
    marginBottom: '40px',
    paddingBottom: '24px',
    borderBottom: `2px solid ${colors.border}`,
    background: colors.bg.primary,
    marginLeft: '-48px',
    marginRight: '-48px',
    marginTop: '-40px',
    paddingLeft: '48px',
    paddingRight: '48px',
    paddingTop: '40px',
    borderRadius: '0 0 16px 16px',
    boxShadow: `0 4px 12px ${colors.shadow}`,
    transition: 'all 0.3s ease',
  } as const;

  const headerStyleMobile = isMobile ? {
    marginLeft: '-16px',
    marginRight: '-16px',
    marginTop: '-20px',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingTop: '20px',
  } : {};

  const titleStyle = {
    margin: 0,
    fontSize: isMobile ? '24px' : '32px',
    fontWeight: '800',
    color: '#667eea',
    letterSpacing: '-0.8px',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'font-size 0.3s ease',
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <div style={{ ...headerStyle, ...headerStyleMobile }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}>
            <Logo size={isMobile ? 'sm' : 'md'} />
            <h1 style={titleStyle}>{title}</h1>
          </div>
        </div>
        <div style={{
          animation: 'fadeIn 0.5s ease-in-out',
        }}>
          {children}
        </div>
      </main>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          body { overflow-x: hidden; }
        }
      `}</style>
    </div>
  );
};

export default PageShell;