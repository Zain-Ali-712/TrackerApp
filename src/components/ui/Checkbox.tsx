import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '../../constants/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  sublabel?: string;
  typeColor?: string; // Optional custom color (e.g. blue for work, orange for health)
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  sublabel,
  typeColor,
  disabled,
  icon,
}) => {
  const activeColor = typeColor || THEME.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : onPress}
      style={[styles.container, disabled && { opacity: 0.55 }]}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: checked ? activeColor : THEME.colors.border },
          checked && { 
            backgroundColor: activeColor,
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3.5} />}
      </View>
      
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      {(label || sublabel) && (
        <View style={styles.textContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                checked && styles.labelChecked,
              ]}
            >
              {label}
            </Text>
          )}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.md,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  label: {
    color: THEME.colors.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  labelChecked: {
    color: THEME.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  sublabel: {
    color: THEME.colors.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  iconContainer: {
    marginRight: THEME.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
