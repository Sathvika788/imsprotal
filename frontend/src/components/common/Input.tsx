import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  multiline = false,
  rows = 4,
  disabled = false,
  required = false,
}: InputProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '12px',
    border: `1.5px solid ${error ? '#fca5a5' : colors.border}`,
    backgroundColor: colors.bg.secondary,
    color: colors.text.primary,
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'auto',
  } as React.CSSProperties;

  const Component = multiline ? 'textarea' : 'input';

  // Generate unique ID for placeholder styling
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: colors.text.primary,
          letterSpacing: '-0.2px',
        }}>
          {label}
          {error && <span style={{ color: '#dc2626' }}> *</span>}
        </label>
      )}
      <Component
        id={inputId}
        type={multiline ? undefined : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#fca5a5' : colors.border;
          e.currentTarget.style.boxShadow = 'none';
        }}
        style={inputStyle}
      />
      <style>{`
        #${inputId}::placeholder {
          color: ${colors.text.secondary} !important;
          opacity: 0.7;
        }
        #${inputId}::-webkit-input-placeholder {
          color: ${colors.text.secondary} !important;
          opacity: 0.7;
        }
        #${inputId}:-moz-placeholder {
          color: ${colors.text.secondary} !important;
          opacity: 0.7;
        }
      `}</style>
      {error && (
        <p style={{
          marginTop: '6px',
          fontSize: '12px',
          color: '#dc2626',
          fontWeight: '500',
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
