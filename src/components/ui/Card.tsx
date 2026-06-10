import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)', // Translucent glass slate
    borderColor: 'rgba(255, 255, 255, 0.08)', // High-tech thin border
    borderWidth: 1.5,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
});
