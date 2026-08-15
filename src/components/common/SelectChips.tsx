/**
 * Selectable Chips Component with Liquid Glass background and tactile selection physics.
 */
import React from 'react';
import { ScrollView, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii } from '../../core/theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';

export interface ChipItem {
  id: string;
  label: string;
  count?: number;
}

export interface SelectChipsProps {
  items: ChipItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export const SelectChips: React.FC<SelectChipsProps> = ({ items, selectedId, onSelect, style }) => {
  const { colors, isDark } = useAppStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <AnimatedPressable
            key={item.id}
            scaleTarget={0.94}
            onPress={() => {
              RTCHaptics.selection();
              onSelect(item.id);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : colors.card2,
                borderColor: isSelected
                  ? 'rgba(255, 255, 255, 0.25)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : colors.line,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#FFFFFF' : isDark ? colors.txt : colors.mut,
                  fontWeight: isSelected ? '800' : '600',
                },
              ]}
            >
              {item.label} {item.count !== undefined ? `(${item.count})` : ''}
            </Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chipText: {
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
