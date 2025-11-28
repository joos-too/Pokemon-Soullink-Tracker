export type SupportedLanguage = 'de' | 'en';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['de', 'en'];

export function normalizeLanguage(lng?: string | null): SupportedLanguage {
  if (!lng) return 'de';
  const value = lng.toLowerCase();
  if (value.startsWith('en')) {
    return 'en';
  }
  return 'de';
}
