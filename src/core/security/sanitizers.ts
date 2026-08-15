/**
 * Security utilities, sanitizers, validators, and route access guards.
 * Exactly replicates js/security.js & SQL backend security constraints.
 */

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const ICON_REGEX = /^ph(-[a-z0-9]+)+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeColor(color: string | undefined | null, fallback = '#00288E'): string {
  const v = String(color || '').trim();
  return HEX_REGEX.test(v) ? v : fallback;
}

export function safeIcon(icon: string | undefined | null, fallback = 'ph-book-open'): string {
  const v = String(icon || '').trim();
  const parts = v.split(/\s+/);
  if (parts.length && parts.every((p) => ICON_REGEX.test(p))) return parts.join(' ');
  return fallback;
}

export function isUuid(value: any): boolean {
  return UUID_REGEX.test(String(value || ''));
}

export function safeUrl(value: string | undefined | null, fallback = ''): string {
  try {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (/^tel:\+?[0-9]{3,15}$/.test(raw)) return raw;
    if (/^https:\/\//i.test(raw)) {
      const u = new URL(raw);
      if (u.username || u.password || /[\u0000-\u001f\u007f]/.test(raw)) return fallback;
      return u.href;
    }
    return fallback;
  } catch (e) {
    return fallback;
  }
}

export function maskPhone(phone: string | undefined | null): string {
  const s = String(phone || '').trim();
  if (s.length < 7) return '—';
  return s.slice(0, 3) + '••••' + s.slice(-2);
}

export function maskName(name: string | undefined | null): string {
  const s = String(name || '').trim();
  if (!s) return '—';
  const parts = s.split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? p : p[0] + '***'))
    .join(' ');
}

export function validateFullName(name: string): boolean {
  const clean = String(name || '').trim();
  if (/<[a-z][\s\S]*>/i.test(clean)) return false; // Prevent HTML tags
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.length >= 3;
}

export function validateEgyptianPhone(phone: string): boolean {
  // Normalize common user formats: "010 1234 5678", "010-123-45678",
  // Arabic digits and parentheses are accepted (fixes F-7).
  const clean = String(phone || '')
    .replace(/[\s\-–—().]/g, '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
  return EGYPT_PHONE_REGEX.test(clean);
}

// Route Guards
const STUDENT_ROUTES = {
  prefix: ['s-', 'support'],
  extra: ['support'],
  // Students must NOT reach shared staff screens even though they
  // start with "s-" (fixes a real privilege leak found in the QA pass).
  deny: ['s-analytics'],
};

const VOLUNTEER_ROUTES = {
  prefix: ['v-', 's-analytics', 'support', 's-notifications', 's-edit-profile'],
  extra: [] as string[],
  deny: [] as string[],
};

const ADMIN_ROUTES = {
  prefix: ['a-', 's-analytics', 'support', 's-notifications', 's-edit-profile'],
  extra: [] as string[],
  deny: [] as string[],
};

const PUBLIC_ROUTES = ['splash', 'onboarding', 'verify', 'changelog'];

export function canAccess(screenId: string, role: string | null | undefined): boolean {
  if (!screenId) return false;
  if (PUBLIC_ROUTES.includes(screenId)) return true;
  if (!role) return false;

  const allow = role === 'admin' ? ADMIN_ROUTES : role === 'volunteer' ? VOLUNTEER_ROUTES : STUDENT_ROUTES;
  if (allow.deny.includes(screenId)) return false;
  if (allow.extra.includes(screenId)) return true;

  return allow.prefix.some((p) => screenId === p || screenId.startsWith(p));
}
