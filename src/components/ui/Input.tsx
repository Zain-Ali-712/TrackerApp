import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          multiline && styles.textArea,
          inputStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.sm,
    width: '100%',
  },
  label: {
    color: THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs,
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: 14.5,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
