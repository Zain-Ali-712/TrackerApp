import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const getButtonStyles = () => {
    const btnStyles: ViewStyle[] = [styles.button];

    // Variant & Glow Shadows
    if (variant === 'primary') {
      btnStyles.push(styles.primary);
      if (!disabled && !loading) {
        btnStyles.push(THEME.shadows.glowGreen as ViewStyle);
      }
    } else if (variant === 'secondary') {
      btnStyles.push(styles.secondary);
    } else if (variant === 'danger') {
      btnStyles.push(styles.danger);
      if (!disabled && !loading) {
        btnStyles.push(styles.glowDanger as ViewStyle);
      }
    }

    // Size
    if (size === 'sm') btnStyles.push(styles.smBtn);
    else if (size === 'lg') btnStyles.push(styles.lgBtn);
    else btnStyles.push(styles.mdBtn); // Explicitly apply mdBtn styling for consistency

    if (disabled || loading) btnStyles.push(styles.disabled);

    return btnStyles;
  };

  const getTextStyles = () => {
    const textStyles: TextStyle[] = [styles.text];

    if (variant === 'secondary') textStyles.push(styles.textSecondary);
    if (size === 'sm') textStyles.push(styles.textSm);
    if (size === 'lg') textStyles.push(styles.textLg);

    return textStyles;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' ? THEME.colors.text : '#fff'} />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: THEME.colors.primary,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  secondary: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  danger: {
    backgroundColor: THEME.colors.danger,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  glowDanger: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  smBtn: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    height: 38,
  },
  mdBtn: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    height: 50,
  },
  lgBtn: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    height: 58,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700', // Bold/Semi-bold text for premium feel
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  textSecondary: {
    color: THEME.colors.text,
  },
  textSm: {
    fontSize: 12.5,
  },
  textLg: {
    fontSize: 16,
  },
});

