import React from 'react';
import { View, StyleSheet, useWindowDimensions, PixelRatio } from 'react-native';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  minItemWidth?: number;
  maxColumns?: number;
  style?: any;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 12,
  minItemWidth = 145,
  maxColumns = 4,
  style,
}) => {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();

  // If font scale is very large, force 1 column for accessibility
  let targetCols = 2;
  if (width < 350 || fontScale > 1.25) {
    targetCols = 1;
  } else if (width >= 900) {
    targetCols = Math.min(4, maxColumns);
  } else if (width >= 600) {
    targetCols = Math.min(3, maxColumns);
  } else {
    // Normal mobile: check if 2 columns fit with minItemWidth
    const available = width - 32; // account for typical screen padding
    const cols = Math.floor((available + spacing) / (minItemWidth + spacing));
    targetCols = Math.min(Math.max(1, cols), 2);
  }

  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.container, { marginHorizontal: -spacing / 2 }, style]}>
      {childArray.map((child, index) => {
        const itemWidthPercent = `${100 / targetCols}%` as any;
        return (
          <View
            key={index}
            style={[
              styles.itemWrapper,
              {
                width: itemWidthPercent,
                paddingHorizontal: spacing / 2,
                marginBottom: spacing,
              },
            ]}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  itemWrapper: {
    justifyContent: 'flex-start',
  },
});
