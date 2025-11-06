import {ref, set, update, get} from 'firebase/database';
import type {User} from 'firebase/auth';
import {db} from '@/src/firebaseConfig';
import {INITIAL_STATE, createInitialState} from '@/constants';
import type {RivalGender, TrackerMember, TrackerMeta, TrackerRole} from '@/types';

export class TrackerOperationError extends Error {
  code: 'user-not-found' | 'member-exists' | 'invalid-input' | 'unknown';
  details?: unknown;

  constructor(message: string, code: TrackerOperationError['code'], details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const encodeEmailKey = (normalizedEmail: string): string => normalizedEmail.replace(/[.#$/\[\]]/g, '_');

export const ensureUserProfile = async (user: User): Promise<void> => {
  if (!user.email) return;
  const now = Date.now();
  const profileRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(profileRef);
  const payload = {
    uid: user.uid,
    email: user.email,
    emailLowerCase: normalizeEmail(user.email),
    lastLoginAt: now,
  };
  if (snapshot.exists()) {
    await update(profileRef, payload);
  } else {
    await set(profileRef, {
      ...payload,
      createdAt: now,
    });
  }

  const normalizedEmail = normalizeEmail(user.email);
  const emailKey = encodeEmailKey(normalizedEmail);
  const updates: Record<string, unknown> = {
    [`userEmails/${emailKey}`]: {
      uid: user.uid,
      email: user.email,
      emailLowerCase: normalizedEmail,
      updatedAt: now,
    },
  };

  const previousEmail = snapshot.val()?.emailLowerCase;
  if (previousEmail && previousEmail !== normalizedEmail) {
    updates[`userEmails/${encodeEmailKey(previousEmail)}`] = null;
  }

  await update(ref(db), updates);
};

export const findUserByEmail = async (email: string): Promise<{ uid: string; email: string } | null> => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const emailKey = encodeEmailKey(normalized);
  const lookupRef = ref(db, `userEmails/${emailKey}`);
  const snapshot = await get(lookupRef);
  if (!snapshot.exists()) return null;
  const value = snapshot.val();
  if (!value?.uid) return null;
  return { uid: value.uid, email: value.email ?? normalized };
};

const resolveUsersByEmails = async (emails: string[]): Promise<{
  found: Array<{ uid: string; email: string }>;
  missing: string[];
}> => {
  const unique = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)));
  const lookups = await Promise.all(unique.map(async (mail) => ({
    email: mail,
    result: await findUserByEmail(mail),
  })));
  const found = lookups
    .filter((entry) => entry.result)
    .map((entry) => entry.result!) as Array<{ uid: string; email: string }>;
  const missing = lookups.filter((entry) => !entry.result).map((entry) => entry.email);
  return { found, missing };
};

const buildMember = (uid: string, email: string, role: TrackerRole): TrackerMember => ({
  uid,
  email,
  role,
  addedAt: Date.now(),
});

interface CreateTrackerPayload {
  title: string;
  player1Name: string;
  player2Name: string;
  memberEmails: string[];
  owner: User;
  gameVersionId: string;
}

export const createTracker = async ({
  title,
  player1Name,
  player2Name,
  memberEmails,
  owner,
  gameVersionId,
}: CreateTrackerPayload): Promise<{ trackerId: string; meta: TrackerMeta }> => {
  if (!owner.email) {
    throw new TrackerOperationError('Owner benötigt eine gültige Email.', 'invalid-input');
  }

  const sanitizedTitle = title.trim() || 'Neuer Tracker';
  const sanitizedP1 = player1Name.trim() || INITIAL_STATE.player1Name;
  const sanitizedP2 = player2Name.trim() || INITIAL_STATE.player2Name;
  const filteredEmails = (memberEmails ?? [])
    .map(normalizeEmail)
    .filter((email) => email && email !== normalizeEmail(owner.email!));

  const { found, missing } = await resolveUsersByEmails(filteredEmails);
  if (missing.length > 0) {
    throw new TrackerOperationError('Einige Emails wurden nicht gefunden.', 'user-not-found', missing);
  }

  const trackerId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const createdAt = Date.now();
  const members: Record<string, TrackerMember> = {
    [owner.uid]: buildMember(owner.uid, owner.email!, 'owner'),
  };

  for (const entry of found) {
    members[entry.uid] = buildMember(entry.uid, entry.email, 'editor');
  }

  const meta: TrackerMeta = {
    id: trackerId,
    title: sanitizedTitle,
    player1Name: sanitizedP1,
    player2Name: sanitizedP2,
    createdAt,
    createdBy: owner.uid,
    members,
    gameVersionId,
  };

  const initialState = createInitialState(gameVersionId);
  initialState.player1Name = sanitizedP1;
  initialState.player2Name = sanitizedP2;

  const updates: Record<string, unknown> = {
    [`trackers/${trackerId}/meta`]: meta,
    [`trackers/${trackerId}/state`]: initialState,
  };

  Object.keys(members).forEach((uid) => {
    updates[`userTrackers/${uid}/${trackerId}`] = true;
  });

  await update(ref(db), updates);
  return { trackerId, meta };
};

export const addMemberByEmail = async (
  trackerId: string,
  email: string,
  role: TrackerRole = 'editor'
): Promise<TrackerMember> => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new TrackerOperationError('Bitte gib eine gültige Email an.', 'invalid-input');
  }

  const existingSnap = await get(ref(db, `trackers/${trackerId}/meta/members`));
  const existingMembers = existingSnap.exists() ? existingSnap.val() as Record<string, TrackerMember> : {};
  const alreadyMember = Object.values(existingMembers).find((member) => normalizeEmail(member.email) === normalized);
  if (alreadyMember) {
    throw new TrackerOperationError('Nutzer ist bereits Mitglied des Trackers.', 'member-exists');
  }

  const lookup = await findUserByEmail(normalized);
  if (!lookup) {
    throw new TrackerOperationError('Kein Account mit dieser Email gefunden.', 'user-not-found');
  }

  const member = buildMember(lookup.uid, lookup.email, role);
  const updates: Record<string, unknown> = {
    [`trackers/${trackerId}/meta/members/${member.uid}`]: member,
    [`userTrackers/${member.uid}/${trackerId}`]: true,
  };

  await update(ref(db), updates);
  return member;
};

export const deleteTracker = async (trackerId: string): Promise<void> => {
  if (!trackerId) {
    throw new TrackerOperationError('Ungültiger Tracker.', 'invalid-input');
  }

  const trackerSnapshot = await get(ref(db, `trackers/${trackerId}`));
  if (!trackerSnapshot.exists()) {
    return;
  }

  const trackerValue = trackerSnapshot.val() as { meta?: TrackerMeta };
  const memberEntries = trackerValue?.meta?.members ?? {};

  const updates: Record<string, unknown> = {
    [`trackers/${trackerId}`]: null,
  };

  Object.keys(memberEntries).forEach((uid) => {
    updates[`userTrackers/${uid}/${trackerId}`] = null;
  });

  await update(ref(db), updates);
};

export const updateRivalPreference = async (
    trackerId: string,
    userId: string,
    rivalKey: string,
    gender: RivalGender
): Promise<void> => {
    const prefPath = `trackers/${trackerId}/meta/userSettings/${userId}/rivalPreferences/${rivalKey}`;
    await set(ref(db, prefPath), gender);
};