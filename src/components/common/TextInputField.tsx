/**
 * Native Text Input Field with Label, Validation, and RTL support.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Radii } from '../../core/theme/tokens';

export interface TextInputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  icon,
}) => {
  const { colors } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.txt }]}>
          {label} {required ? <Text style={{ color: colors.red }}>*</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card2,
            borderColor: error ? colors.red : isFocused ? colors.primary : colors.line,
            borderWidth: 1.5,
            minHeight: multiline ? 90 : 52,
          },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mut}
          accessibilityLabel={label || placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: editable ? colors.txt : colors.mut,
              textAlign: keyboardType === 'phone-pad' || keyboardType === 'email-address' ? 'left' : 'right',
              textAlignVertical: multiline ? 'top' : 'center',
            },
            multiline && { minHeight: 80, paddingTop: 10 },
            inputStyle,
          ]}
        />
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right',
  },
  inputContainer: {
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingVertical: 10,
  },
  icon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
});
