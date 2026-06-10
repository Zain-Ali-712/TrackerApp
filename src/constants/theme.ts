export const THEME = {
  colors: {
    background: '#070b13',     // Ultra-deep space blue
    surface: '#0f172a',        // Slate 900 / Navy surface
    surfaceCard: '#1e293b',    // Slate 800 / Elevated card surface
    border: '#334155',         // Slate 700 border
    borderMuted: '#1e293b',    // Lighter slate border
    text: '#f8fafc',           // Slate 50 bright text
    textMuted: '#94a3b8',      // Slate 400 muted text
    
    // Core Neon Accents
    primary: '#10b981',        // Success / Neon Green
    primaryDark: '#059669',
    accentPurple: '#8b5cf6',   // Neon Purple
    accentPurpleDark: '#7c3aed',
    accentYellow: '#f59e0b',   // Neon Yellow
    accentYellowDark: '#d97706',
    
    warning: '#f59e0b',
    danger: '#ef4444',
    
    // Legacy maps to preserve compatibility
    accentBlue: '#8b5cf6',     // Map work/projects to purple
    accentBlueDark: '#7c3aed',
    accentGray: '#f59e0b',     // Map recovery/habits to yellow
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 26,
    xxl: 36,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  shadows: {
    glowPurple: {
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    glowGreen: {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    glowYellow: {
      shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    }
  },
  typography: {
    h1: {
      fontSize: 26,
      fontWeight: '700' as const,
      color: '#f8fafc',
    },
    h2: {
      fontSize: 21,
      fontWeight: '600' as const,
      color: '#f8fafc',
    },
    h3: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: '#f8fafc',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#f8fafc',
    },
    bodyMuted: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#94a3b8',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: '#94a3b8',
    },
  }
};

