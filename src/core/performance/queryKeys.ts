/**
 * Central Query Keys for TanStack React Query cache management.
 */

export const QueryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  branches: (force?: boolean) => ['branches', { force }] as const,
  courses: (branchId?: string) => ['courses', { branchId }] as const,
  courseDetail: (courseId: string) => ['courseDetail', courseId] as const,
  myEnrollments: (userId?: string) => ['myEnrollments', userId] as const,
  volunteerBatches: (instructorId?: string) => ['volunteerBatches', instructorId] as const,
  batchRoster: (batchId: string) => ['batchRoster', batchId] as const,
  notifications: (userId?: string) => ['notifications', userId] as const,
  certificates: (userId?: string) => ['certificates', userId] as const,
  ledger: (userId?: string) => ['ledger', userId] as const,
  leaderboard: () => ['leaderboard'] as const,
  analytics: (role?: string) => ['analytics', role] as const,
  committees: () => ['committees'] as const,
};
