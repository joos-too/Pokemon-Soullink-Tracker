import type { TFunction } from 'i18next';
import type { VariableRival } from '@/types';

const toKey = (versionId?: string | null, suffix?: string) => {
  if (!versionId || !suffix) return null;
  return `gameVersions.${versionId}.${suffix}`;
};

export const getLocalizedGameName = (
  t: TFunction,
  versionId?: string | null,
  fallback: string = ''
) => {
  const key = toKey(versionId, 'name');
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

const ensureId = (id: number | string) => String(id);

export const getLocalizedArenaLabel = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string
) => {
  const key = toKey(versionId, `levelCaps.${ensureId(capId)}.arena`);
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const getLocalizedRivalLocation = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string
) => {
  const key = toKey(versionId, `rivalCaps.${ensureId(capId)}.location`);
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const getLocalizedRivalName = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string
) => {
  const key = toKey(versionId, `rivalCaps.${ensureId(capId)}.rival`);
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const resolveRivalDisplayName = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  rival: string | VariableRival
) => {
  const baseName = typeof rival === 'string' ? rival : rival.name;
  return getLocalizedRivalName(t, versionId, capId, baseName);
};
