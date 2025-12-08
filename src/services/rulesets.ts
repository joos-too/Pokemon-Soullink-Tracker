import { get, onValue, ref, remove, set } from "firebase/database";
import { db } from "@/src/firebaseConfig";
import type { Ruleset } from "@/types";
import { PRESET_RULESETS } from "@/src/data/rulesets";
import { sanitizeRules } from "@/src/services/init.ts";

const generateRulesetId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeRuleset = (id: string, value: any): Ruleset => ({
  id,
  name: typeof value?.name === "string" ? value.name : "Regelset",
  description:
    typeof value?.description === "string" ? value.description : undefined,
  rules: sanitizeRules(value?.rules),
  isPreset: Boolean(value?.isPreset),
  createdBy: typeof value?.createdBy === "string" ? value.createdBy : undefined,
  createdAt: typeof value?.createdAt === "number" ? value.createdAt : undefined,
  updatedAt: typeof value?.updatedAt === "number" ? value.updatedAt : undefined,
});

export interface SaveRulesetPayload {
  id?: string;
  name: string;
  description?: string;
  rules: string[];
}

export const listenToUserRulesets = (
  userId: string,
  callback: (rulesets: Ruleset[]) => void,
): (() => void) => {
  const rulesetRef = ref(db, `rulesets/${userId}`);
  return onValue(
    rulesetRef,
    (snapshot) => {
      const value = snapshot.val();
      const rulesets: Ruleset[] = value
        ? Object.entries(value).map(([id, entry]) =>
            normalizeRuleset(id, entry),
          )
        : [];
      callback(rulesets);
    },
    () => callback([]),
  );
};

export const saveRuleset = async (
  userId: string,
  payload: SaveRulesetPayload,
): Promise<Ruleset> => {
  const rules = sanitizeRules(payload.rules);
  const now = Date.now();
  const rulesetId = payload.id || generateRulesetId();

  let createdAt = now;
  if (payload.id) {
    const existingSnap = await get(ref(db, `rulesets/${userId}/${rulesetId}`));
    const existingCreatedAt = existingSnap.child("createdAt").val();
    if (typeof existingCreatedAt === "number") {
      createdAt = existingCreatedAt;
    }
  }

  const record: Ruleset = {
    id: rulesetId,
    name: payload.name.trim() || "Neues Regelset",
    description: payload.description?.trim() || "",
    rules: rules.length > 0 ? rules : PRESET_RULESETS[0]?.rules || [],
    createdBy: userId,
    isPreset: false,
    createdAt,
    updatedAt: now,
  };

  await set(ref(db, `rulesets/${userId}/${rulesetId}`), record);
  return record;
};

export const deleteRuleset = async (
  userId: string,
  rulesetId: string,
): Promise<void> => {
  await remove(ref(db, `rulesets/${userId}/${rulesetId}`));
};
