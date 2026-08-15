/**
 * Selectable Chips Component (for filters, branches, categories).
 */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { RTCHaptics } from '../../core/native/haptics';
import { Radii } from '../../core/theme/tokens';

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
  const { colors } = useAppStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => {
              RTCHaptics.selection();
              onSelect(item.id);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.card2,
                borderColor: isSelected ? 'transparent' : colors.line,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#FFFFFF' : colors.mut,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {item.label} {item.count !== undefined ? `(${item.count})` : ''}
            </Text>
          </TouchableOpacity>
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
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
});
