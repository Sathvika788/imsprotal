import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import Logo from '../common/Logo';
import {
  LayoutDashboard, FileText, CheckSquare, Receipt, DollarSign,
  Calendar, Users, Mail, LogOut, BarChart3, Plane, Home, CalendarCheck,FolderGit2,
  FileX,
  MessageSquare,
  BookOpen,  // ADD
  Download,
} from 'lucide-react';

const Sidebar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const colors = getThemeColors(theme);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const roleAccent =
    user?.role === 'intern' ? '#0ea5e9'
    : user?.role === 'manager' ? '#6366f1'
    : '#f59e0b';

  const roleLight =
    user?.role === 'intern' ? '#e0f2fe'
    : user?.role === 'manager' ? '#ede9fe'
    : '#fef3c7';

  const navBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    color: colors.text.secondary,
    textDecoration: 'none',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '500',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '4px',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    position: 'relative',
  };

  const activeNav: React.CSSProperties = {
    ...navBase,
    background: `${roleAccent}15`,
    color: roleAccent,
    fontWeight: '600',
    boxShadow: `0 4px 12px ${roleAccent}20`,
  };

  const internLinks = [
    { to: '/intern', icon: 'LayoutDashboard', label: 'Dashboard' },
    { to: '/intern/logs', icon: 'FileText', label: 'Work Logs' },
    { to: '/intern/tasks', icon: 'CheckSquare', label: 'Tasks' },
    { to: '/intern/expenses', icon: 'Receipt', label: 'Expenses' },
    { to: '/intern/stipend', icon: 'DollarSign', label: 'Stipend' },
    { to: '/intern/attendance', icon: 'Calendar', label: 'Attendance' },
    { to: '/intern/leave', icon: 'Plane', label: 'Leave Requests' },
    { to: '/intern/wfh', icon: 'Home', label: 'Work From Home' },
    { to: '/intern/projects', icon: 'FolderGit2', label: 'Projects' },
    { to: '/intern/relieving', icon: 'FileX', label: 'Relieving' },
    { to: '/intern/complaints', icon: 'MessageSquare', label: 'Complaints' },
    { to: '/intern/kt', icon: 'BookOpen', label: 'Knowledge Transfer' },
  ];

  const managerLinks = [
    { to: '/manager', icon: 'LayoutDashboard', label: 'Dashboard' },
    { to: '/manager/logs', icon: 'FileText', label: 'Verify Logs' },
    { to: '/manager/tasks', icon: 'CheckSquare', label: 'Manage Tasks' },
    { to: '/manager/expenses', icon: 'Receipt', label: 'Review Expenses' },
    { to: '/manager/leaves', icon: 'CalendarCheck', label: 'Leave Requests' },
    { to: '/manager/wfh', icon: 'Home', label: 'WFH Requests' },
    { to: '/manager/stipends', icon: 'DollarSign', label: 'Stipends' },
    { to: '/manager/attendance', icon: 'Calendar', label: 'Attendance' },
    { to: '/manager/interns', icon: 'Users', label: 'Interns' },
    { to: '/manager/invites', icon: 'Mail', label: 'Invites' },
    { to: '/manager/projects', icon: 'FolderGit2', label: 'Review Projects' },
    { to: '/manager/relievings', icon: 'FileX', label: 'Relievings' },
    { to: '/manager/complaints', icon: 'MessageSquare', label: 'Complaints' },
    { to: '/manager/reports', icon: 'Download', label: 'Download Reports' },
    { to: '/manager/kt', icon: 'BookOpen', label: 'Review KT' },
  ];

  const ceoLinks = [
    { to: '/ceo', icon: 'BarChart3', label: 'Analytics' },
    ...managerLinks,
  ];

  const links =
    user?.role === 'ceo' ? ceoLinks
    : user?.role === 'manager' ? managerLinks
    : internLinks;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div style={{
      width: isCollapsed ? '80px' : '280px',
      background: colors.bg.primary,
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'width 0.3s ease',
      boxShadow: `4px 0 24px ${colors.shadow}`,
      zIndex: 1000,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Logo & Brand */}
      <div style={{ 
        padding: '24px 16px 20px', 
        borderBottom: `1px solid ${colors.border}`,
        background: `linear-gradient(135deg, ${roleAccent}10, ${roleAccent}05)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <Logo size="md" showText={!isCollapsed} />
          {!isCollapsed && (
            <div style={{ opacity: 1, transition: 'opacity 0.2s' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '13.5px', 
                fontWeight: '700', 
                color: colors.text.primary,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.3px',
              }}>
                {user?.name || 'User'}
              </p>
              <span style={{
                fontSize: '11px', 
                fontWeight: '700', 
                textTransform: 'uppercase',
                letterSpacing: '0.6px', 
                color: roleAccent,
                display: 'block',
                marginTop: '2px',
              }}>
                {user?.role}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ 
        flex: 1, 
        padding: '20px 12px', 
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <p style={{ 
          fontSize: '11px', 
          fontWeight: '800', 
          color: colors.text.tertiary, 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          margin: '0 0 14px 6px',
          transition: 'all 0.2s',
        }}>
          {!isCollapsed && 'Navigation'}
        </p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/intern' || link.to === '/manager' || link.to === '/ceo'}
            style={({ isActive }) => isActive ? activeNav : navBase}
            title={isCollapsed ? link.label : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px' }}>
              👁️
            </span>
            {!isCollapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div style={{ 
        padding: '16px 12px', 
        borderTop: `1px solid ${colors.border}`,
        background: `linear-gradient(to top, ${colors.bg.tertiary}, transparent)`,
      }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '11px 14px', 
            background: `${roleAccent}15`,
            border: `1px solid ${roleAccent}30`,
            borderRadius: '12px', 
            color: roleAccent, 
            cursor: 'pointer',
            fontSize: '13.5px', 
            fontWeight: '600', 
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.2s',
            marginBottom: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${roleAccent}25`;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${roleAccent}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${roleAccent}15`;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>{theme === 'light' ? '🌙' : '☀️'}</span>
          {!isCollapsed && <span>Theme</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '11px 14px', 
            background: '#fee2e2', 
            border: '1px solid #fecaca',
            borderRadius: '12px', 
            color: '#dc2626', 
            cursor: 'pointer',
            fontSize: '13.5px', 
            fontWeight: '600', 
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fecaca';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>🚪</span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle - Mobile friendly */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          right: isCollapsed ? '-12px' : '-12px',
          top: '20px',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: colors.bg.primary,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '12px',
          zIndex: 1001,
        }}
        title={isCollapsed ? 'Expand' : 'Collapse'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.bg.tertiary;
          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.bg.primary;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isCollapsed ? '→' : '←'}
      </button>
    </div>
  );
};

export default Sidebar;