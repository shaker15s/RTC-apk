/**
 * Changelog & What's New Screen (changelog)
 * Documents application releases, upgrades, and feature announcements.
 * Fully bilingual: release content is built inside the component so it
 * re-evaluates on every language change (v100.4.0c).
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppStore } from '../../state/appStore';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { CustomCard } from '../../components/common/CustomCard';
import { Sparkles, Check, ShieldCheck, Zap } from 'lucide-react-native';
import { Radii } from '../../core/theme/tokens';
import { useT } from '../../core/i18n';

export interface ChangelogScreenProps {
  onBack: () => void;
}

export const ChangelogScreen: React.FC<ChangelogScreenProps> = ({ onBack }) => {
  const { colors } = useAppStore();
  const { t } = useT();

  // Built on every render so language switching translates it live.
  const releases = [
    {
      version: t('relV1004'),
      date: t('relAug2026'),
      badge: t('releaseMajor'),
      items: [t('relV1004B1'), t('relV1004B2'), t('relV1004B3'), t('relV1004B4'), t('relV1004B5')],
    },
    {
      version: t('relV1003'),
      date: t('relAug2026'),
      badge: t('releaseI18n'),
      items: [t('relV1003B1')],
    },
    {
      version: t('relV1002'),
      date: t('relAug2026'),
      badge: t('releaseNative'),
      items: [t('relV1002B1'), t('relV1002B2'), t('relV1002B3'), t('relV1002B4'), t('relV1002B5')],
    },
    {
      version: t('relV1001'),
      date: t('relAug2026'),
      badge: t('releaseQuality'),
      items: [
        t('relV1001B1'), t('relV1001B2'), t('relV1001B3'), t('relV1001B4'),
        t('relV1001B5'), t('relV1001B6'), t('relV1001B7'), t('relV1001B8'),
      ],
    },
    {
      version: t('relV1000'),
      date: t('relAug2026'),
      badge: t('releaseMajor'),
      items: [
        t('relV1000B1'), t('relV1000B2'), t('relV1000B3'), t('relV1000B4'),
        t('relV1000B5'), t('relV1000B6'), t('relV1000B7'),
      ],
    },
    {
      version: t('relV100'),
      date: t('relJul2026'),
      badge: t('releaseLaunch'),
      items: [t('relV100B1'), t('relV100B2')],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader
        title={t('changelogTitle')}
        subtitle={t('changelogSubtitle')}
        showBack
        onBack={onBack}
        showNotif={false}
        showAvatar={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {releases.map((rel) => (
          <CustomCard key={rel.version} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.versionWrap}>
                <Text style={[styles.versionText, { color: colors.primary }]}>{rel.version}</Text>
                <Text style={[styles.dateText, { color: colors.mut }]}>{rel.date}</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.primarySoft }]}>
                <Sparkles color={colors.primary} size={12} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>{rel.badge}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.line }]} />

            {rel.items.map((item, i) => (
              <View key={`${rel.version}-${i}`} style={styles.bulletRow}>
                <View style={[styles.checkCircle, { backgroundColor: colors.teal + '18' }]}>
                  <Check color={colors.teal} size={13} />
                </View>
                <Text style={[styles.bulletText, { color: colors.txt }]}>{item}</Text>
              </View>
            ))}
          </CustomCard>
        ))}

        <View style={styles.footerNote}>
          <ShieldCheck color={colors.mut} size={14} />
          <Text style={[styles.footerText, { color: colors.mut }]}>
            {t('org')} — {t('freeNotice')}
          </Text>
          <Zap color={colors.gold} size={14} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  versionWrap: {
    flex: 1,
    gap: 2,
  },
  versionText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11.5,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
});
