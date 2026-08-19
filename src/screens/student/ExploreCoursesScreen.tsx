/**
 * Explore Courses Screen (s-explore)
 * Search, branch filters, category filters, and course cards with fast join.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../state/appStore';
import { useAuthStore } from '../../state/authStore';
import { Repository, Course } from '../../data/repositories';
import { CustomCard } from '../../components/common/CustomCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { TextInputField } from '../../components/common/TextInputField';
import { SelectChips } from '../../components/common/SelectChips';
import { SkeletonLoader } from '../../components/feedback/SkeletonLoader';
import { EmptyStateView } from '../../components/feedback/EmptyStateView';
import { RTCHaptics } from '../../core/native/haptics';
import {
  Compass,
  Search,
  Calendar,
  MapPin,
  ChevronLeft,
  BookOpen,
} from 'lucide-react-native';
import { useT, t } from '../../core/i18n';
import { Radii } from '../../core/theme/tokens';

export interface ExploreCoursesScreenProps {
  onNavigate: (screenId: string, params?: any) => void;
  onBack?: () => void;
}

export const ExploreCoursesScreen: React.FC<ExploreCoursesScreenProps> = ({ onNavigate, onBack }) => {
  const { colors, showToast } = useAppStore();
  const { t } = useT();
  const { branches } = useAuthStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = async () => {
    try {
      const data = await Repository.fetchCourses(
        false,
        selectedBranchId === 'all' ? undefined : selectedBranchId
      );
      setCourses(data);
    } catch (e) {
      showToast(t('coursesLoadError'), 'warn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [selectedBranchId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
  };

  // Branch filter chips
  const branchChips = [
    { id: 'all', label: t('acAllBranches') },
    ...branches.map((b) => ({ id: b.id, label: b.name_ar })),
  ];

  // Category list derived from courses
  const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
  const categoryChips = [
    { id: 'all', label: t('exAllCats') },
    ...categories.map((c) => ({ id: c, label: c })),
  ];

  const filteredCourses = courses.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GlassHeader title={t('exTitle')} subtitle={t('exSubtitle')} showBack={!!onBack} onBack={onBack} />

      {/* Search Input */}
      <View style={styles.searchSection}>
        <TextInputField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('exSearchPlaceholder')}
          icon={<Search color={colors.mut} size={18} />}
          style={{ marginBottom: 4 }}
        />
      </View>

      {/* Branch & Category Filter Chips */}
      <View style={styles.filtersSection}>
        <SelectChips
          items={branchChips}
          selectedId={selectedBranchId}
          onSelect={setSelectedBranchId}
          style={{ paddingHorizontal: 16 }}
        />
        {categories.length > 1 ? (
          <SelectChips
            items={categoryChips}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
            style={{ paddingHorizontal: 16, marginTop: 4 }}
          />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <SkeletonLoader height={130} borderRadius={Radii.xl} />
            <SkeletonLoader height={130} borderRadius={Radii.xl} />
            <SkeletonLoader height={130} borderRadius={Radii.xl} />
          </View>
        ) : filteredCourses.length ? (
          filteredCourses.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => {
                RTCHaptics.light();
                onNavigate('s-course-detail', { courseId: item.id });
              }}
            >
              <CustomCard style={styles.courseCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <View style={styles.tagsRow}>
                      <View style={[styles.catBadge, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.catText, { color: colors.primary }]}>{item.category || t('trainingGeneral')}</Text>
                      </View>
                      {item.level ? (
                        <View style={[styles.levelBadge, { backgroundColor: colors.teal + '18' }]}>
                          <Text style={[styles.levelText, { color: colors.teal }]}>{item.level}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.courseTitle, { color: colors.txt }]}>{item.title}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.descText, { color: colors.mut }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.footerRow}>
                  <View style={styles.footerLeft}>
                    <View style={styles.footerItem}>
                      <Calendar color={colors.mut} size={14} />
                      <Text style={[styles.footerItemText, { color: colors.mut }]}>
                        {item.sessions_count} {t('lecturesSuffix')}
                      </Text>
                    </View>
                    <View style={styles.footerItem}>
                      <MapPin color={colors.mut} size={14} />
                      <Text style={[styles.footerItemText, { color: colors.mut }]}>
                        {item.branches?.name_ar || t('resalaBranch')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailArrow, { backgroundColor: colors.card2 }]}>
                    <ChevronLeft color={colors.primary} size={16} />
                  </View>
                </View>
              </CustomCard>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyStateView
            title={t('exNoResults')}
            description={t('exNoResultsDesc')}
            icon={<Compass color={colors.primary} size={32} />}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  filtersSection: {
    paddingBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 90,
    gap: 12,
  },
  courseCard: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontSize: 11.5,
  },
  detailArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
