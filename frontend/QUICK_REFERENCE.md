# 🚀 Quick Reference: Using the New Design System

## Import Components

```tsx
// Import from component library
import { Card, Button, Badge, Input, StatCard } from '@/components/common';

// Import theme
import { useTheme, getThemeColors } from '@/context/ThemeContext';

// Import layout
import PageShell from '@/components/layout/PageShell';
```

## Common Patterns

### 1. Basic Page Layout

```tsx
import PageShell from '@/components/layout/PageShell';
import { Card, Button } from '@/components/common';

export default function MyPage() {
  return (
    <PageShell title="My Dashboard">
      <Card title="Welcome">
        <p>Hello, user!</p>
        <Button variant="primary">Click me</Button>
      </Card>
    </PageShell>
  );
}
```

### 2. Using Theme Colors

```tsx
import { useTheme, getThemeColors } from '@/context/ThemeContext';

export default function StyledComponent() {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{
      background: colors.bg.primary,
      color: colors.text.primary,
      borderColor: colors.border,
      padding: '20px',
      borderRadius: '12px',
    }}>
      Beautifully themed content
    </div>
  );
}
```

### 3. Dashboard with Stats

```tsx
import { useTheme, getThemeColors } from '@/context/ThemeContext';
import { StatCard } from '@/components/common';

export default function Dashboard() {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    }}>
      <StatCard 
        title="Total Users"
        value={2450}
        icon="👥"
        trend={12}
        color="#667eea"
      />
      <StatCard 
        title="Active Sessions"
        value={189}
        icon="🔄"
        trend={-5}
        color="#0ea5e9"
      />
      <StatCard 
        title="Revenue"
        value="$24.5K"}
        icon="💰"
        trend={18}
        color="#16a34a"
      />
    </div>
  );
}
```

### 4. Form with Validation

```tsx
import { useState } from 'react';
import { Card, Input, Button } from '@/components/common';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate and submit
  };

  return (
    <Card title="Register" subtitle="Create a new account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
        <Button variant="primary" fullWidth type="submit">
          Register
        </Button>
      </form>
    </Card>
  );
}
```

### 5. Status Table

```tsx
import { Card, Badge } from '@/components/common';

export default function StatusTable() {
  const items = [
    { id: 1, name: 'John', status: 'active', score: 95 },
    { id: 2, name: 'Jane', status: 'pending', score: 87 },
    { id: 3, name: 'Bob', status: 'inactive', score: 45 },
  ];

  const getStatusVariant = (status) => {
    const map = {
      'active': 'success',
      'pending': 'warning',
      'inactive': 'danger',
    };
    return map[status] || 'info';
  };

  return (
    <Card title="Interns">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '12px 0' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px 0' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '12px 0' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 0' }}>{item.name}</td>
              <td style={{ padding: '12px 0' }}>
                <Badge variant={getStatusVariant(item.status)}>
                  {item.status}
                </Badge>
              </td>
              <td style={{ padding: '12px 0' }}>{item.score}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
```

### 6. Responsive Grid

```tsx
export default function ResponsiveGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
    }}>
      {/* Cards will automatically arrange */}
    </div>
  );
}
```

### 7. Button Variations

```tsx
import { Button } from '@/components/common';

export default function ButtonShowcase() {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {/* Variants */}
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="success">Confirm</Button>

      {/* Sizes */}
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>

      {/* States */}
      <Button disabled>Disabled</Button>
      <Button loading>Loading...</Button>
      <Button fullWidth>Full Width</Button>
    </div>
  );
}
```

### 8. Dark Mode Toggle

```tsx
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
```

### 9. Responsive Mobile-First

```tsx
import { useState, useEffect } from 'react';

export default function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '16px' : '24px',
      padding: isMobile ? '16px' : '40px',
    }}>
      {/* Content */}
    </div>
  );
}
```

### 10. Animated Card Hover

```tsx
import { Card } from '@/components/common';

export default function InteractiveCard() {
  return (
    <Card onClick={() => console.log('Clicked!')} hover>
      <h3>Click me!</h3>
      <p>This card lifts on hover</p>
    </Card>
  );
}
```

## Color Reference

```tsx
const { theme } = useTheme();
const colors = getThemeColors(theme);

// Background colors
colors.bg.primary      // Main background
colors.bg.secondary    // Secondary (slightly different shade)
colors.bg.tertiary     // Tertiary (most different)
colors.bg.accent       // Gradient accent

// Text colors
colors.text.primary    // Main text
colors.text.secondary  // Secondary text (muted)
colors.text.tertiary   // Tertiary text (very muted)

// Other
colors.border          // Border color
colors.card            // Card background
colors.shadow          // Shadow color (theme-aware)
```

## Theme Colors (Hardcoded)

```tsx
// Primary gradient
const primary = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

// Role colors
const intern = '#0ea5e9';    // Sky Blue
const manager = '#6366f1';   // Indigo
const ceo = '#f59e0b';       // Amber

// Semantic
const success = '#16a34a';   // Green
const danger = '#dc2626';    // Red
const warning = '#d97706';   // Amber
const info = '#0ea5e9';      // Blue
```

## Animation Timing

```tsx
// Standard transitions
transition: 'all 0.2s'                                    // Quick interactions
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'     // Smooth easing
transition: 'all 0.15s'                                  // Fast feedback

// Common durations
200ms  → Button hover, input focus
300ms  → Sidebar collapse, page transitions
500ms  → Fade-in animations
```

## Tips & Best Practices

✅ Always use theme colors from `getThemeColors()`
✅ Use component library for consistency
✅ Test dark mode by toggling theme
✅ Use responsive grid layouts
✅ Keep animations within 200-300ms
✅ Use semantic HTML
✅ Test on mobile devices
✅ Follow existing styling patterns

---

**Need more examples?** Check `DESIGN_SYSTEM.md` for comprehensive documentation!
