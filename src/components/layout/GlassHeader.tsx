/**
 * GlassHeader component matching web header with blur effect, safe-area, notif dot, and avatar.
 */
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Bell, ChevronRight, User } from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { RTCHaptics } from '../../core/native/haptics';
import { EasterEggModal } from '../feedback/EasterEggModal';

import { Avatar } from '../common/Avatar';

export interface GlassHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotif?: boolean;
  onNotifPress?: () => void;
  showAvatar?: boolean;
  onAvatarPress?: () => void;
  rightAction?: React.ReactNode;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title = t('appName'),
  subtitle,
  showBack = false,
  onBack,
  showNotif = true,
  onNotifPress,
  showAvatar = true,
  onAvatarPress,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppStore();
  const { profile } = useAuthStore();

  const [eggModalVisible, setEggModalVisible] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: isDark ? 'rgba(12, 18, 32, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          borderBottomColor: colors.line,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left side (Back or Logo) */}
        <View style={styles.left}>
          {showBack && onBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                RTCHaptics.light();
                onBack();
              }}
              style={[styles.iconButton, { backgroundColor: colors.card2, borderColor: colors.line }]}
            >
              <ChevronRight color={colors.txt} size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const now = Date.now();
                if (now - lastTapRef.current < 450) {
                  tapCountRef.current += 1;
                } else {
                  tapCountRef.current = 1;
                }
                lastTapRef.current = now;

                RTCHaptics.light();

                if (tapCountRef.current === 5) {
                  tapCountRef.current = 0;
                  setEggModalVisible(true);
                }
              }}
              style={[styles.logoWrap, { borderColor: colors.line }]}
            >
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logo}
                defaultSource={require('../../../assets/icon.png')}
              />
            </TouchableOpacity>
          )}

          <View style={styles.titleWrap}>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.mut }]}>{subtitle}</Text> : null}
            <Text style={[styles.title, { color: colors.txt }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        {/* Right side (Actions / Notification / Avatar) */}
        <View style={styles.right}>
          {rightAction}

          {showNotif && onNotifPress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                RTCHaptics.light();
                onNotifPress();
              }}
              style={[styles.iconButton, { backgroundColor: colors.card2, borderColor: colors.line }]}
            >
              <Bell color={colors.txt} size={19} />
            </TouchableOpacity>
          ) : null}

          {showAvatar && onAvatarPress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                RTCHaptics.light();
                onAvatarPress();
              }}
            >
              <Avatar
                uri={profile?.avatar_url}
                name={profile?.full_name || t('studentFallback')}
                size="sm"
                borderColor={colors.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <EasterEggModal
        visible={eggModalVisible}
        type={profile?.role === 'volunteer' ? 'resala_cheer' : 'dev_mode'}
        onClose={() => setEggModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  content: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleWrap: {
    flex: 1,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
