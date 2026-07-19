import { get, ref, set, update } from "firebase/database";
import { db } from "@/src/firebaseConfig";
import type { AuthenticatedUser } from "@/src/services/auth.ts";
import {
  createInitialState,
  MIN_PLAYER_COUNT,
  sanitizePlayerNames,
  sanitizeRules,
} from "@/src/services/init.ts";
import { DEFAULT_RULESET_ID } from "@/src/data/rulesets.ts";
import type {
  RivalGender,
  TrackerMember,
  TrackerMeta,
  TrackerRole,
} from "@/types";

export class TrackerOperationError extends Error {
  code: "user-not-found" | "member-exists" | "invalid-input" | "unknown";
  details?: unknown;

  constructor(
    message: string,
    code: TrackerOperationError["code"],
    details?: unknown,
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const normalizeEmail = (email?: string | null): string =>
  email?.trim().toLowerCase() ?? "";
const encodeEmailKey = (normalizedEmail: string): string =>
  normalizedEmail.replace(/[.#$/\[\]]/g, "_");

export const getDefaultDisplayName = (email?: string | null): string => {
  const localPart = normalizeEmail(email).split("@", 1)[0]?.trim();
  return (localPart || "Trainer").slice(0, 50);
};

const normalizeDisplayName = (displayName: string): string => {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new TrackerOperationError(
      "Bitte gib einen Anzeigenamen ein.",
      "invalid-input",
    );
  }
  if (normalized.length > 50) {
    throw new TrackerOperationError(
      "Der Anzeigename darf höchstens 50 Zeichen lang sein.",
      "invalid-input",
    );
  }
  return normalized;
};

export const ensureUserProfile = async (
  user: AuthenticatedUser,
): Promise<void> => {
  if (!user.email) return;
  const now = Date.now();
  const profileRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(profileRef);
  const payload = {
    uid: user.uid,
    lastLoginAt: now,
  };
  const existingDisplayName = snapshot.child("displayName").val();
  const displayName =
    typeof existingDisplayName === "string" && existingDisplayName.trim()
      ? existingDisplayName.trim()
      : getDefaultDisplayName(user.email);
  if (snapshot.exists()) {
    await update(profileRef, { ...payload, displayName });
  } else {
    await set(profileRef, {
      ...payload,
      createdAt: now,
      displayName,
    });
  }

  const normalizedEmail = normalizeEmail(user.email);
  const emailKey = encodeEmailKey(normalizedEmail);
  const updates: Record<string, unknown> = {
    [`userEmails/${emailKey}`]: {
      uid: user.uid,
      updatedAt: now,
    },
  };

  await update(ref(db), updates);
};

export const findUserByEmail = async (
  email: string,
): Promise<{ uid: string; email: string } | null> => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const emailKey = encodeEmailKey(normalized);
  const lookupRef = ref(db, `userEmails/${emailKey}`);
  const snapshot = await get(lookupRef);
  if (!snapshot.exists()) return null;
  const value = snapshot.val();
  if (!value?.uid) return null;
  return { uid: value.uid, email };
};

const resolveUsersByEmails = async (
  emails: string[],
): Promise<{
  found: Array<{ uid: string; email: string }>;
  missing: string[];
}> => {
  const unique = Array.from(
    new Set(emails.map(normalizeEmail).filter(Boolean)),
  );
  const lookups = await Promise.all(
    unique.map(async (mail) => ({
      email: mail,
      result: await findUserByEmail(mail),
    })),
  );
  const found = lookups
    .filter((entry) => entry.result)
    .map((entry) => entry.result!) as Array<{ uid: string; email: string }>;
  const missing = lookups
    .filter((entry) => !entry.result)
    .map((entry) => entry.email);
  return { found, missing };
};

const buildMember = (
  uid: string,
  email: string,
  role: TrackerRole,
  displayName = getDefaultDisplayName(email),
): TrackerMember => ({
  uid,
  email,
  displayName,
  role,
  addedAt: Date.now(),
});

type InviteRole = Exclude<TrackerRole, "owner">;

interface InviteEntry {
  email: string;
  role: InviteRole;
}

interface CreateTrackerPayload {
  title: string;
  playerNames: string[];
  memberInvites: InviteEntry[];
  owner: AuthenticatedUser;
  gameVersionId: string;
  allPokemonAndItems?: boolean;
  rulesetId?: string;
  rules?: string[];
}

export const createTracker = async ({
  title,
  playerNames,
  memberInvites,
  owner,
  gameVersionId,
  allPokemonAndItems,
  rulesetId,
  rules,
}: CreateTrackerPayload): Promise<{ trackerId: string; meta: TrackerMeta }> => {
  if (!owner.email) {
    throw new TrackerOperationError(
      "Owner benötigt eine gültige Email.",
      "invalid-input",
    );
  }

  const sanitizedTitle = title.trim() || "Neuer Tracker";
  const normalizedPlayerNames = sanitizePlayerNames(playerNames).map((name) =>
    name.trim(),
  );
  if (normalizedPlayerNames.length < MIN_PLAYER_COUNT) {
    throw new TrackerOperationError(
      "Ein Tracker benötigt mindestens einen Spieler.",
      "invalid-input",
    );
  }
  if (normalizedPlayerNames.some((name) => name.length === 0)) {
    throw new TrackerOperationError(
      "Bitte gib für alle Spieler einen Namen ein.",
      "invalid-input",
    );
  }
  const inviteByEmail = new Map<string, InviteRole>();
  (memberInvites ?? []).forEach(({ email, role }) => {
    const normalized = normalizeEmail(email);
    if (!normalized || normalized === normalizeEmail(owner.email!)) return;
    if (!inviteByEmail.has(normalized)) {
      inviteByEmail.set(normalized, role === "guest" ? "guest" : "editor");
    }
  });

  const filteredEmails = Array.from(inviteByEmail.keys());

  const { found, missing } = await resolveUsersByEmails(filteredEmails);
  if (missing.length > 0) {
    throw new TrackerOperationError(
      "Einige Emails wurden nicht gefunden.",
      "user-not-found",
      missing,
    );
  }

  const trackerId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const createdAt = Date.now();
  const ownerDisplayName = await getUserDisplayName(owner.uid, owner.email);
  const members: Record<string, TrackerMember> = {
    [owner.uid]: buildMember(
      owner.uid,
      owner.email!,
      "owner",
      ownerDisplayName,
    ),
  };
  const guests: Record<string, TrackerMember> = {};

  for (const entry of found) {
    const role =
      inviteByEmail.get(normalizeEmail(entry.email)) === "guest"
        ? "guest"
        : "editor";
    if (role === "guest") {
      guests[entry.uid] = buildMember(entry.uid, entry.email, "guest");
    } else {
      members[entry.uid] = buildMember(entry.uid, entry.email, "editor");
    }
  }

  const normalizedRules = sanitizeRules(rules);
  const resolvedRulesetId =
    typeof rulesetId === "string" && rulesetId.trim().length > 0
      ? rulesetId
      : DEFAULT_RULESET_ID;

  const meta: TrackerMeta = {
    id: trackerId,
    title: sanitizedTitle,
    playerNames: normalizedPlayerNames,
    createdAt,
    createdBy: owner.uid,
    members,
    guests,
    gameVersionId,
    ...(allPokemonAndItems ? { allPokemonAndItems: true } : {}),
    rulesetId: resolvedRulesetId,
    isPublic: false,
  };

  const initialState = createInitialState(
    gameVersionId,
    normalizedPlayerNames,
    {
      id: resolvedRulesetId,
      rules: normalizedRules,
    },
  );

  const trackerUpdates: Record<string, unknown> = {
    [`trackers/${trackerId}/meta`]: meta,
    [`trackers/${trackerId}/state`]: initialState,
  };
  trackerUpdates[`userTrackers/${owner.uid}/${trackerId}`] = true;

  await update(ref(db), trackerUpdates);

  const userTrackerUpdates: Record<string, unknown> = {};
  Object.keys(members)
    .filter((uid) => uid !== owner.uid)
    .forEach((uid) => {
      userTrackerUpdates[`userTrackers/${uid}/${trackerId}`] = true;
    });

  Object.keys(guests).forEach((uid) => {
    userTrackerUpdates[`userTrackers/${uid}/${trackerId}`] = true;
  });

  if (Object.keys(userTrackerUpdates).length > 0) {
    await update(ref(db), userTrackerUpdates);
  }
  return { trackerId, meta };
};

export const addMemberByEmail = async (
  trackerId: string,
  email: string,
  role: InviteRole = "editor",
): Promise<TrackerMember> => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new TrackerOperationError(
      "Bitte gib eine gültige Email an.",
      "invalid-input",
    );
  }

  const metaSnap = await get(ref(db, `trackers/${trackerId}/meta`));
  const existingMembers = metaSnap.child("members").exists()
    ? (metaSnap.child("members").val() as Record<string, TrackerMember>)
    : {};
  const existingGuests = metaSnap.child("guests").exists()
    ? (metaSnap.child("guests").val() as Record<string, TrackerMember>)
    : {};

  const duplicateEntry = [
    ...Object.values(existingMembers),
    ...Object.values(existingGuests),
  ].find((member) => normalizeEmail(member.email) === normalized);
  if (duplicateEntry) {
    throw new TrackerOperationError(
      "Nutzer ist bereits Mitglied des Trackers.",
      "member-exists",
    );
  }

  const lookup = await findUserByEmail(normalized);
  if (!lookup) {
    throw new TrackerOperationError(
      "Kein Account mit dieser Email gefunden.",
      "user-not-found",
    );
  }

  const targetRole: InviteRole = role === "guest" ? "guest" : "editor";
  const member = buildMember(lookup.uid, lookup.email, targetRole);
  const updates: Record<string, unknown> = {
    [`trackers/${trackerId}/meta/${targetRole === "guest" ? "guests" : "members"}/${member.uid}`]:
      member,
    [`userTrackers/${member.uid}/${trackerId}`]: true,
  };

  await update(ref(db), updates);
  return member;
};

export const removeMemberFromTracker = async (
  trackerId: string,
  memberUid: string,
): Promise<void> => {
  if (!trackerId || !memberUid) {
    throw new TrackerOperationError(
      "Ungültige Anfrage zum Entfernen.",
      "invalid-input",
    );
  }

  const memberRef = ref(db, `trackers/${trackerId}/meta/members/${memberUid}`);
  const guestRef = ref(db, `trackers/${trackerId}/meta/guests/${memberUid}`);
  const [memberSnap, guestSnap] = await Promise.all([
    get(memberRef),
    get(guestRef),
  ]);

  const isGuest = !memberSnap.exists() && guestSnap.exists();
  if (!memberSnap.exists() && !guestSnap.exists()) {
    throw new TrackerOperationError(
      "Mitglied wurde nicht gefunden.",
      "invalid-input",
    );
  }

  const member = (
    isGuest ? guestSnap.val() : memberSnap.val()
  ) as TrackerMember;
  if (!isGuest && member.role === "owner") {
    throw new TrackerOperationError(
      "Owner können nicht entfernt werden.",
      "invalid-input",
    );
  }

  const updates: Record<string, unknown> = {
    [`userTrackers/${memberUid}/${trackerId}`]: null,
  };

  if (isGuest) {
    updates[`trackers/${trackerId}/meta/guests/${memberUid}`] = null;
  } else {
    updates[`trackers/${trackerId}/meta/members/${memberUid}`] = null;
    updates[`trackers/${trackerId}/meta/userSettings/${memberUid}`] = null;
  }

  await update(ref(db), updates);
};

export const deleteTracker = async (trackerId: string): Promise<void> => {
  if (!trackerId) {
    throw new TrackerOperationError("Ungültiger Tracker.", "invalid-input");
  }

  const trackerSnapshot = await get(ref(db, `trackers/${trackerId}`));
  if (!trackerSnapshot.exists()) {
    return;
  }

  const trackerValue = trackerSnapshot.val() as { meta?: TrackerMeta };
  const memberEntries = trackerValue?.meta?.members ?? {};
  const guestEntries = trackerValue?.meta?.guests ?? {};

  const updates: Record<string, unknown> = {
    [`trackers/${trackerId}`]: null,
  };

  Object.keys(memberEntries).forEach((uid) => {
    updates[`userTrackers/${uid}/${trackerId}`] = null;
  });

  Object.keys(guestEntries).forEach((uid) => {
    updates[`userTrackers/${uid}/${trackerId}`] = null;
  });

  await update(ref(db), updates);
};

export const updateRivalPreference = async (
  trackerId: string,
  userId: string,
  rivalKey: string,
  gender: RivalGender,
): Promise<void> => {
  const prefPath = `trackers/${trackerId}/meta/userSettings/${userId}/rivalPreferences/${rivalKey}`;
  await set(ref(db, prefPath), gender);
};

export const updateUserGenerationSpritePreference = async (
  userId: string,
  useGenerationSprites: boolean,
): Promise<void> => {
  const userPath = `users/${userId}/useGenerationSprites`;
  await set(ref(db, userPath), useGenerationSprites);
};

export const getUserDisplayName = async (
  userId: string,
  email?: string | null,
): Promise<string> => {
  const snapshot = await get(ref(db, `users/${userId}/displayName`));
  const storedDisplayName = snapshot.val();
  return typeof storedDisplayName === "string" && storedDisplayName.trim()
    ? storedDisplayName.trim().slice(0, 50)
    : getDefaultDisplayName(email);
};

export const updateUserDisplayName = async (
  userId: string,
  displayName: string,
): Promise<void> => {
  const normalizedDisplayName = normalizeDisplayName(displayName);
  const userTrackersSnapshot = await get(ref(db, `userTrackers/${userId}`));
  const trackerIds = userTrackersSnapshot.exists()
    ? Object.keys(userTrackersSnapshot.val())
    : [];
  const trackerMetas = await Promise.all(
    trackerIds.map(async (trackerId) => ({
      trackerId,
      snapshot: await get(ref(db, `trackers/${trackerId}/meta`)),
    })),
  );

  await set(ref(db, `users/${userId}/displayName`), normalizedDisplayName);

  const memberUpdates: Record<string, unknown> = {};
  trackerMetas.forEach(({ trackerId, snapshot }) => {
    const meta = snapshot.val() as TrackerMeta | null;
    if (meta?.members?.[userId]) {
      memberUpdates[
        `trackers/${trackerId}/meta/members/${userId}/displayName`
      ] = normalizedDisplayName;
    } else if (meta?.guests?.[userId]) {
      memberUpdates[`trackers/${trackerId}/meta/guests/${userId}/displayName`] =
        normalizedDisplayName;
    }
  });

  if (Object.keys(memberUpdates).length === 0) return;

  try {
    await update(ref(db), memberUpdates);
  } catch (error) {
    // Legacy Firebase rules grant guests read-only tracker access. Their
    // profile still updates; Supabase reads display names from profiles.
    console.warn(
      "Could not mirror display name into Firebase tracker data",
      error,
    );
  }
};

export const getUserGenerationSpritePreference = async (
  userId: string,
): Promise<boolean> => {
  const userPath = `users/${userId}/useGenerationSprites`;
  const snapshot = await get(ref(db, userPath));
  return snapshot.exists() ? snapshot.val() : false;
};

export const updateUserSpritesInTeamTablePreference = async (
  userId: string,
  useSpritesInTeamTable: boolean,
): Promise<void> => {
  const userPath = `users/${userId}/useSpritesInTeamTable`;
  await set(ref(db, userPath), useSpritesInTeamTable);
};

export const getUserSpritesInTeamTablePreference = async (
  userId: string,
): Promise<boolean> => {
  const userPath = `users/${userId}/useSpritesInTeamTable`;
  const snapshot = await get(ref(db, userPath));
  return snapshot.exists() ? snapshot.val() : false;
};

export const updateUserWikiPreference = async (
  userId: string,
  wikiId: string,
): Promise<void> => {
  const userPath = `users/${userId}/wikiId`;
  await set(ref(db, userPath), wikiId);
};

export const getUserWikiPreference = async (
  userId: string,
): Promise<string | null> => {
  const userPath = `users/${userId}/wikiId`;
  const snapshot = await get(ref(db, userPath));
  return snapshot.exists() ? (snapshot.val() as string) : null;
};

export const updateUserMultiLocaleSearchPreference = async (
  userId: string,
  multiLocaleSearch: boolean,
): Promise<void> => {
  const userPath = `users/${userId}/multiLocaleSearch`;
  await set(ref(db, userPath), multiLocaleSearch);
};

export const getUserMultiLocaleSearchPreference = async (
  userId: string,
): Promise<boolean> => {
  const userPath = `users/${userId}/multiLocaleSearch`;
  const snapshot = await get(ref(db, userPath));
  return snapshot.exists() ? snapshot.val() : false;
};
