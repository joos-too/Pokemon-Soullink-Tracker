import { get, onValue, ref, set, update } from "firebase/database";
import { db } from "@/src/firebaseConfig.ts";
import type { AppState, TrackerMeta } from "@/types";
import { BACKEND } from "@/src/services/backend.ts";
import {
  getSupabaseTrackerState,
  setSupabaseTrackerVisibility,
  subscribeToSupabaseTrackerMeta,
  subscribeToSupabaseTrackerState,
  subscribeToSupabaseUserTrackerIds,
  updateSupabaseTrackerMetadata,
  updateSupabaseTrackerState,
} from "@/src/services/supabaseTrackerRepository.ts";

export { TrackerStateConflictError } from "@/src/services/supabaseTrackerRepository.ts";

export type RepositorySubscription = () => void;

type ValueCallback<T> = (value: T | null) => void;
type ErrorCallback = (error: Error) => void;

const stateRevisions = new Map<string, number>();

/**
 * Firebase implementation of the tracker repository.
 *
 * App components use this API rather than SDK primitives. The Supabase
 * implementation will retain these operations while using joined queries,
 * Postgres Changes, and revision-aware RPC writes.
 */
export const subscribeToUserTrackerIds = (
  userId: string,
  onValueChange: ValueCallback<string[]>,
  onError?: ErrorCallback,
): RepositorySubscription =>
  BACKEND === "supabase"
    ? subscribeToSupabaseUserTrackerIds(userId, onValueChange, onError)
    : onValue(
        ref(db, `userTrackers/${userId}`),
        (snapshot) => {
          onValueChange(snapshot.exists() ? Object.keys(snapshot.val()) : []);
        },
        (error) => onError?.(error),
      );

export const subscribeToTrackerMeta = (
  trackerId: string,
  onValueChange: ValueCallback<TrackerMeta>,
  onError?: ErrorCallback,
): RepositorySubscription =>
  BACKEND === "supabase"
    ? subscribeToSupabaseTrackerMeta(trackerId, onValueChange, onError)
    : onValue(
        ref(db, `trackers/${trackerId}/meta`),
        (snapshot) => onValueChange(snapshot.val() as TrackerMeta | null),
        (error) => onError?.(error),
      );

export const subscribeToTrackerState = (
  trackerId: string,
  onValueChange: ValueCallback<Partial<AppState>>,
  onError?: ErrorCallback,
): RepositorySubscription =>
  BACKEND === "supabase"
    ? subscribeToSupabaseTrackerState(
        trackerId,
        (snapshot) => {
          if (!snapshot) {
            stateRevisions.delete(trackerId);
            onValueChange(null);
            return;
          }
          stateRevisions.set(trackerId, snapshot.revision);
          onValueChange(snapshot.state);
        },
        onError,
      )
    : onValue(
        ref(db, `trackers/${trackerId}/state`),
        (snapshot) => onValueChange(snapshot.val() as Partial<AppState> | null),
        (error) => onError?.(error),
      );

export const getTrackerState = async (
  trackerId: string,
): Promise<Partial<AppState> | null> => {
  if (BACKEND === "supabase") {
    const snapshot = await getSupabaseTrackerState(trackerId);
    if (!snapshot) return null;
    stateRevisions.set(trackerId, snapshot.revision);
    return snapshot.state;
  }

  const snapshot = await get(ref(db, `trackers/${trackerId}/state`));
  return snapshot.val() as Partial<AppState> | null;
};

export const saveTrackerState = async (
  trackerId: string,
  state: AppState,
): Promise<void> => {
  if (BACKEND === "supabase") {
    let expectedRevision = stateRevisions.get(trackerId);
    if (expectedRevision === undefined) {
      const snapshot = await getSupabaseTrackerState(trackerId);
      if (!snapshot) throw new Error("Tracker state was not found.");
      expectedRevision = snapshot.revision;
    }
    const updatedState = await updateSupabaseTrackerState(
      trackerId,
      expectedRevision,
      state,
    );
    stateRevisions.set(trackerId, updatedState.revision);
    return;
  }

  await set(ref(db, `trackers/${trackerId}/state`), state);
};

export const updateTrackerMetadata = async (
  trackerId: string,
  changes: Partial<
    Pick<
      TrackerMeta,
      | "title"
      | "playerNames"
      | "gameVersionId"
      | "allPokemonAndItems"
      | "rulesetId"
    >
  >,
): Promise<void> => {
  if (BACKEND === "supabase") {
    await updateSupabaseTrackerMetadata(trackerId, changes);
    return;
  }

  await update(ref(db, `trackers/${trackerId}/meta`), changes);
};

export const setTrackerVisibility = async (
  trackerId: string,
  isPublic: boolean,
): Promise<void> => {
  if (BACKEND === "supabase") {
    await setSupabaseTrackerVisibility(trackerId, isPublic);
    return;
  }

  await update(ref(db, `trackers/${trackerId}/meta`), { isPublic });
};
