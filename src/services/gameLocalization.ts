import type { TFunction } from 'i18next';
import type { VariableRival } from '@/types';

const toKey = (versionId?: string | null, suffix?: string) => {
  if (!versionId || !suffix) return null;
  return `gameVersions.${versionId}.${suffix}`;
};

const ensureId = (id: number | string) => String(id);
const normalizeLabel = (label: string) => {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'default';
};

export const getLocalizedGameName = (
  t: TFunction,
  versionId?: string | null,
  fallback: string = ''
) => {
  const key = toKey(versionId, 'name');
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

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

export const getLocalizedSelectionLabel = (
  t: TFunction,
  versionId: string | undefined,
  label: string
) => {
  if (!versionId) return label;
  const key = toKey(versionId, `selection.${normalizeLabel(label)}`);
  return key ? t(key, { defaultValue: label }) : label;
};
