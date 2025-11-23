import type { TFunction } from "i18next";
import type { VariableRival } from "@/types";

const toKey = (versionId?: string | null, suffix?: string) => {
  if (!versionId || !suffix) return null;
  return `gameVersions.${versionId}.${suffix}`;
};

const ensureId = (id: number | string) => String(id);
const normalizeLabel = (label: string) => {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "default";
};

const NO_TRANSLATION = "__soullink_no_translation__";

export const getLocalizedRivalEntry = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
) => {
  const key = toKey(versionId, `rivalCaps.${ensureId(capId)}.rival`);
  if (!key) return undefined;
  const value = t(key, { defaultValue: NO_TRANSLATION, returnObjects: true });
  // @ts-ignore
  return value === NO_TRANSLATION ? undefined : value;
};

export const getLocalizedGameName = (
  t: TFunction,
  versionId?: string | null,
  fallback: string = "",
) => {
  const key = toKey(versionId, "name");
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const getLocalizedArenaLabel = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string,
) => {
  const key = toKey(versionId, `levelCaps.${ensureId(capId)}.arena`);
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const getLocalizedRivalLocation = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string,
) => {
  const key = toKey(versionId, `rivalCaps.${ensureId(capId)}.location`);
  return key ? t(key, { defaultValue: fallback }) : fallback;
};

export const getLocalizedRivalName = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  fallback: string,
) => {
  const localized = getLocalizedRivalEntry(t, versionId, capId);
  if (typeof localized === "string") {
    return localized;
  }
  if (
    localized &&
    typeof localized === "object" &&
    typeof (localized as any).name === "string"
  ) {
    return (localized as { name: string }).name;
  }
  return fallback;
};

export const resolveRivalDisplayName = (
  t: TFunction,
  versionId: string | undefined,
  capId: number | string,
  rival: string | VariableRival,
) => {
  const baseName = typeof rival === "string" ? rival : rival.name;
  const localized = getLocalizedRivalEntry(t, versionId, capId);
  if (typeof localized === "string") {
    return localized;
  }
  if (
    localized &&
    typeof localized === "object" &&
    typeof (localized as any).name === "string"
  ) {
    return (localized as { name: string }).name;
  }
  return baseName;
};

export const getLocalizedSelectionLabel = (
  t: TFunction,
  versionId: string | undefined,
  label: string,
) => {
  if (!versionId) return label;
  const key = toKey(versionId, `selection.${normalizeLabel(label)}`);
  return key ? t(key, { defaultValue: label }) : label;
};
