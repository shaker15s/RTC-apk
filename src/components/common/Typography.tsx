/**
 * Standard Typography Primitives for Masar RTC Native Mobile.
 * Built with Apple HIG & Material 3 typographic scales with strict RTL support and dynamic accessibility.
 */
import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet, I18nManager } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { TypographyTokens } from '../../core/theme/tokens';

export interface BaseTypographyProps extends TextProps {
  children?: React.ReactNode;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: TextStyle['fontWeight'];
  style?: TextStyle | TextStyle[];
}

export const Display: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="header"
      style={[
        TypographyTokens.display,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const TitleLarge: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="header"
      style={[
        TypographyTokens.titleLarge,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const TitleMedium: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="header"
      style={[
        TypographyTokens.titleMedium,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const TitleSmall: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="header"
      style={[
        TypographyTokens.titleSmall,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const BodyLarge: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="text"
      style={[
        TypographyTokens.bodyLarge,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const BodyMedium: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="text"
      style={[
        TypographyTokens.bodyMedium,
        {
          color: color || colors.txtSecondary,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const Caption: React.FC<BaseTypographyProps> = ({
  children,
  color,
  align = 'auto',
  weight,
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="text"
      style={[
        TypographyTokens.caption,
        {
          color: color || colors.mut,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export const Numeric: React.FC<BaseTypographyProps & { prefix?: string; suffix?: string }> = ({
  children,
  color,
  align = 'auto',
  weight,
  prefix = '',
  suffix = '',
  style,
  ...rest
}) => {
  const colors = useAppStore((s) => s.colors);
  return (
    <Text
      accessibilityRole="text"
      style={[
        TypographyTokens.numeric,
        {
          color: color || colors.txt,
          textAlign: align,
          ...(weight ? { fontWeight: weight } : {}),
        },
        style,
      ]}
      {...rest}
    >
      {prefix}
      {children}
      {suffix}
    </Text>
  );
};
