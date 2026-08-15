/**
 * SearchBar Component
 * Search input with debounce, clear icon, and smooth focus states.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { Search, X } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';
import { RTCHaptics } from '../../core/native/haptics';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'بحث...',
  debounceMs = 250,
  onClear,
  style,
}) => {
  const { colors } = useAppStore();
  const [internalVal, setInternalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalVal !== value) {
        onChangeText(internalVal);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalVal, debounceMs]);

  const handleClear = () => {
    RTCHaptics.light();
    setInternalVal('');
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card2,
          borderColor: isFocused ? colors.primary : colors.line,
        },
        style,
      ]}
    >
      <Search color={isFocused ? colors.primary : colors.mut} size={18} />
      <TextInput
        value={internalVal}
        onChangeText={setInternalVal}
        placeholder={placeholder}
        placeholderTextColor={colors.mut}
        accessibilityLabel={placeholder}
        style={[styles.input, { color: colors.txt }]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {internalVal.length > 0 ? (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <X color={colors.mut} size={16} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    textAlign: 'right',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});
