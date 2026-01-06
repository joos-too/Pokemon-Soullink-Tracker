import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FiHome,
  FiMenu,
  FiMoon,
  FiRotateCw,
  FiSettings,
  FiSun,
} from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import type {
  AppState,
  FossilEntry,
  LevelCap,
  Pokemon,
  PokemonLink,
  RivalGender,
  TrackerMeta,
  TrackerSummary,
} from "@/types";
import {
  createInitialState,
  DEFAULT_RULES,
  ensureStatsForPlayers,
  PLAYER_COLORS,
  sanitizePlayerNames,
} from "@/constants";
import TeamTable from "@/src/components/TeamTable";
import InfoPanel from "@/src/components/InfoPanel";
import Graveyard from "@/src/components/Graveyard";
import ClearedRoutes from "@/src/components/ClearedRoutes";
import AddLostPokemonModal from "@/src/components/AddLostPokemonModal";
import FossilTracker from "@/src/components/FossilTracker";
import { getGenerationSpritePath } from "@/src/services/sprites";
import SelectLossModal from "@/src/components/SelectLossModal";
import LoginPage from "@/src/components/LoginPage";
import RegisterPage from "@/src/components/RegisterPage";
import SettingsPage from "@/src/components/SettingsPage";
import UserSettingsPage from "@/src/components/UserSettingsPage";
import PasswordResetPage from "@/src/components/PasswordResetPage";
import ResetModal from "@/src/components/ResetModal";
import EditPairModal from "@/src/components/EditPairModal";
import DarkModeToggle, {
  getDarkMode,
  setDarkMode,
} from "@/src/components/DarkModeToggle";
import HomePage from "@/src/components/HomePage";
import CreateTrackerModal from "@/src/components/CreateTrackerModal";
import DeleteTrackerModal from "@/src/components/DeleteTrackerModal";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { auth, db, USE_EMULATORS } from "@/src/firebaseConfig";
import { get, onValue, ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { seedEmulatorData } from "@/src/services/emulatorSeed";
import {
  addMemberByEmail,
  createTracker,
  deleteTracker,
  ensureUserProfile,
  getUserGenerationSpritePreference,
  getUserSpritesInTeamTablePreference,
  removeMemberFromTracker,
  TrackerOperationError,
  updateRivalPreference,
  updateUserGenerationSpritePreference,
  updateUserSpritesInTeamTablePreference,
} from "@/src/services/trackers";
import { GAME_VERSIONS } from "@/src/data/game-versions";
import { useTranslation } from "react-i18next";
import "@/src/pokeapi"; // initialize Pokedex once so sprite caching SW gets registered

const LAST_TRACKER_STORAGE_KEY = "soullink:lastTrackerId";

const MAX_DATA_GENERATION = 6;
const resolveGenerationFromVersionId = (versionId?: string | null): number => {
  if (!versionId) return MAX_DATA_GENERATION;
  const match = /^gen(\d+)/i.exec(versionId);
  if (!match) return MAX_DATA_GENERATION;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return MAX_DATA_GENERATION;
  return parsed;
};

const computeTrackerSummary = (
  state?: Partial<AppState> | null,
): TrackerSummary => {
  const teamCount = Array.isArray(state?.team) ? state.team.length : 0;
  const boxCount = Array.isArray(state?.box) ? state.box.length : 0;
  const graveyardCount = Array.isArray(state?.graveyard)
    ? state.graveyard.length
    : 0;
  const runs = Number(state?.stats?.runs ?? 0) || 0;
  const levelCaps = Array.isArray(state?.levelCaps)
    ? (state.levelCaps as LevelCap[])
    : [];
  const doneCapsCount = levelCaps.filter((cap) => cap?.done).length;

  const deathCount = Array.isArray(state?.stats?.deaths)
    ? state!.stats!.deaths.reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  return {
    teamCount,
    boxCount,
    graveyardCount,
    deathCount,
    runs,
    championDone: doneCapsCount > 12,
    doneCapsCount,
  };
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPasswordResetRoute = location.pathname === "/reset";
  const passwordResetOobCode = isPasswordResetRoute
    ? searchParams.get("oobCode")
    : null;
  const trackerRouteMatch = useMatch("/tracker/:trackerId");
  const routeTrackerId = trackerRouteMatch?.params?.trackerId ?? null;
  const [data, setData] = useState<AppState>(createInitialState());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const storedTrackerId =
    typeof window !== "undefined"
      ? window.localStorage.getItem(LAST_TRACKER_STORAGE_KEY)
      : null;
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(
    storedTrackerId,
  );
  const [userTrackerIds, setUserTrackerIds] = useState<string[]>([]);
  const [trackerMetas, setTrackerMetas] = useState<Record<string, TrackerMeta>>(
    {},
  );
  const isViewingPublicTracker = useMemo(
    () =>
      !user &&
      Boolean(routeTrackerId && trackerMetas[routeTrackerId]?.isPublic),
    [user, routeTrackerId, trackerMetas],
  );
  const metaListenersRef = useRef<Map<string, () => void>>(new Map());
  const trackerStateListenersRef = useRef<Map<string, () => void>>(new Map());
  const [trackerSummaries, setTrackerSummaries] = useState<
    Record<string, TrackerSummary>
  >({});
  const { t } = useTranslation();
  const [userTrackersLoading, setUserTrackersLoading] = useState(false);
  const [publicTrackerLoading, setPublicTrackerLoading] = useState(() =>
    Boolean(routeTrackerId),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userUseGenerationSprites, setUserUseGenerationSprites] =
    useState(false);
  const [userUseSpritesInTeamTable, setUserUseSpritesInTeamTable] =
    useState(false);
  const showSettings = searchParams.get("panel") === "settings";
  const openSettingsPanel = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("panel", "settings");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const closeSettingsPanel = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("panel");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const skipNextWriteRef = useRef(false);
  const pendingWriteRef = useRef<Promise<void>>(Promise.resolve());
  const isHydratingRef = useRef(true);
  const [showLossModal, setShowLossModal] = useState(false);
  const [pendingLossPair, setPendingLossPair] = useState<PokemonLink | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(getDarkMode());
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTrackerError, setCreateTrackerError] = useState<string | null>(
    null,
  );
  const [createTrackerLoading, setCreateTrackerLoading] = useState(false);
  const [trackerPendingDelete, setTrackerPendingDelete] =
    useState<TrackerMeta | null>(null);
  const [deleteTrackerLoading, setDeleteTrackerLoading] = useState(false);
  const [deleteTrackerError, setDeleteTrackerError] = useState<string | null>(
    null,
  );

  const [reviveArea, setReviveArea] = useState("");
  const [addRevivedPokemonOpen, setAddRevivedPokemonOpen] = useState(false);
  const [pendingReviveIndices, setPendingReviveIndices] = useState<
    number[] | null
  >(null);

  const activeTrackerMeta = activeTrackerId
    ? trackerMetas[activeTrackerId]
    : undefined;
  const activeGameVersionId = activeTrackerMeta?.gameVersionId;
  const activeGameVersion = activeGameVersionId
    ? GAME_VERSIONS[activeGameVersionId]
    : undefined;
  const pokemonGenerationLimit = useMemo(
    () => resolveGenerationFromVersionId(activeGameVersionId),
    [activeGameVersionId],
  );
  const isMember = Boolean(user && activeTrackerMeta?.members?.[user.uid]);
  const isGuest = Boolean(user && activeTrackerMeta?.guests?.[user.uid]);
  const isReadOnly = !isMember;

  const currentUserRivalPreferences = useMemo(() => {
    if (!user || !activeTrackerMeta) return {};
    return activeTrackerMeta.userSettings?.[user.uid]?.rivalPreferences ?? {};
  }, [user, activeTrackerMeta]);

  const generationSpritePath = useMemo(() => {
    // Use generation-specific sprites if enabled
    if (userUseGenerationSprites && activeGameVersionId) {
      return getGenerationSpritePath(activeGameVersionId);
    }
    return null;
  }, [userUseGenerationSprites, activeGameVersionId]);

  const handleRivalPreferenceChange = useCallback(
    async (key: string, gender: RivalGender) => {
      if (!activeTrackerId || !user) return;
      try {
        await updateRivalPreference(activeTrackerId, user.uid, key, gender);
      } catch (error) {
        console.error("Failed to update rival preference:", error);
      }
    },
    [activeTrackerId, user],
  );

  const handleGenerationSpritesToggle = useCallback(
    async (enabled: boolean) => {
      if (!user) return;
      try {
        await updateUserGenerationSpritePreference(user.uid, enabled);
        setUserUseGenerationSprites(enabled);
      } catch (error) {
        console.error("Failed to update generation sprites preference:", error);
      }
    },
    [user],
  );

  const handleSpritesInTeamTableToggle = useCallback(
    async (enabled: boolean) => {
      if (!user) return;
      try {
        await updateUserSpritesInTeamTablePreference(user.uid, enabled);
        setUserUseSpritesInTeamTable(enabled);
      } catch (error) {
        console.error(
          "Failed to update sprites in team table preference:",
          error,
        );
      }
    },
    [user],
  );

  const coerceAppState = useCallback(
    (incoming: any, base: AppState): AppState => {
      const gameVersionForDefaults =
        activeGameVersion ?? GAME_VERSIONS["gen5_sw"];
      const savedLevelCaps = Array.isArray(incoming?.levelCaps)
        ? incoming.levelCaps
        : [];
      const finalLevelCaps = gameVersionForDefaults.levelCaps.map(
        (levelCapTemplate) => {
          const savedState = savedLevelCaps.find(
            (lc) => lc.id === levelCapTemplate.id,
          );
          return {
            ...levelCapTemplate,
            done: savedState?.done ?? false,
          };
        },
      );
      const savedRivalCaps = Array.isArray(incoming?.rivalCaps)
        ? incoming.rivalCaps
        : [];
      const finalRivalCaps = gameVersionForDefaults.rivalCaps.map(
        (rivalCapTemplate) => {
          const savedState = savedRivalCaps.find(
            (rc) => rc.id === rivalCapTemplate.id,
          );
          return {
            ...rivalCapTemplate,
            done: savedState?.done ?? false,
            revealed: savedState?.revealed ?? false,
          };
        },
      );

      const safe = incoming && typeof incoming === "object" ? incoming : {};
      const legacyNames: string[] = [
        safe.player1Name,
        safe.player2Name,
        safe.player3Name,
      ].filter(
        (name): name is string =>
          typeof name === "string" && name.trim().length > 0,
      );
      const normalizedNames = sanitizePlayerNames(
        Array.isArray(safe.playerNames)
          ? safe.playerNames
          : legacyNames.length > 0
            ? legacyNames
            : base.playerNames,
      );
      const playerCount = normalizedNames.length;

      const sanitizePokemon = (pokemon: any): Pokemon => ({
        name: typeof pokemon?.name === "string" ? pokemon.name : "",
        nickname: typeof pokemon?.nickname === "string" ? pokemon.nickname : "",
      });

      const sanitizeMembers = (link: any): Pokemon[] => {
        const members = Array.isArray(link?.members)
          ? link.members.map(sanitizePokemon)
          : [];
        if (members.length === 0) {
          ["player1", "player2", "player3"].forEach((key) => {
            if (link?.[key]) {
              members.push(sanitizePokemon(link[key]));
            }
          });
        }
        return members;
      };

      const sanitizeLink = (p: any, fallbackId: number): PokemonLink => {
        const members = sanitizeMembers(p);
        const hasNickname = members.some(
          (member) => member.nickname.trim().length > 0,
        );
        const inferredLost = members.length > 0 && !hasNickname;
        const isLost = typeof p?.isLost === "boolean" ? p.isLost : inferredLost;
        return {
          id:
            Number.isFinite(Number(p?.id)) && Number(p?.id) > 0
              ? Number(p?.id)
              : fallbackId,
          route: typeof p?.route === "string" ? p.route : "",
          members,
          isLost,
        };
      };

      const sanitizeArray = (arr: any): PokemonLink[] => {
        const list = Array.isArray(arr) ? arr : [];
        return list.map((p, index) => sanitizeLink(p, index + 1));
      };

      const sanitizeFossils = (playerFossils: any): FossilEntry[][] => {
        return normalizedNames.map((_, i) => {
          const list = Array.isArray(playerFossils) ? playerFossils[i] : null;
          if (!Array.isArray(list)) return [];
          return list.map((f: any) => ({
            fossilId: f.fossilId || "",
            location: f.location || "",
            inBag: !!f.inBag,
            revived: !!f.revived,
            pokemonName: f.pokemonName || "",
          }));
        });
      };

      const stats = ensureStatsForPlayers(safe.stats, playerCount);

      return {
        playerNames: normalizedNames,
        team: sanitizeArray(safe.team),
        box: sanitizeArray(safe.box),
        graveyard: sanitizeArray(safe.graveyard),
        rules: Array.isArray(safe.rules)
          ? safe.rules
              .map((r: any) => (typeof r === "string" ? r : ""))
              .filter((r: string) => r.trim().length > 0)
          : (base.rules ?? DEFAULT_RULES),
        levelCaps: finalLevelCaps,
        rivalCaps: finalRivalCaps,
        stats: {
          ...stats,
          runs:
            typeof safe.stats?.runs === "number" ? safe.stats.runs : stats.runs,
          best:
            typeof safe.stats?.best === "number" ? safe.stats.best : stats.best,
        },
        legendaryTrackerEnabled:
          safe.legendaryTrackerEnabled ?? base.legendaryTrackerEnabled ?? true,
        rivalCensorEnabled:
          safe.rivalCensorEnabled ?? base.rivalCensorEnabled ?? true,
        hardcoreModeEnabled:
          safe.hardcoreModeEnabled ?? base.hardcoreModeEnabled ?? true,
        infiniteFossilsEnabled:
          safe.infiniteFossilsEnabled ?? base.infiniteFossilsEnabled ?? false,
        fossils: sanitizeFossils(safe.fossils),
        runStartedAt:
          typeof safe.runStartedAt === "number"
            ? safe.runStartedAt
            : typeof base.runStartedAt === "number"
              ? base.runStartedAt
              : 0,
      };
    },
    [activeGameVersion],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Seed emulator with test data when running in emulator mode
   * This effect runs after Firebase initialization and creates:
   * - A test user (test@example.com)
   * - A sample tracker with pre-populated team, box, and graveyard data
   * The seeding is idempotent and checks for existing data to prevent duplication
   */
  useEffect(() => {
    if (USE_EMULATORS && !loading) {
      seedEmulatorData().catch((error) => {
        console.error("Failed to seed emulator data:", error);
      });
    }
  }, [loading]);

  useEffect(() => {
    if (!user) {
      setAuthScreen("login");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    ensureUserProfile(user).catch(() => {});
    // Load user's sprite preferences
    Promise.all([
      getUserGenerationSpritePreference(user.uid),
      getUserSpritesInTeamTablePreference(user.uid),
    ])
      .then(([genSprites, teamTableSprites]) => {
        setUserUseGenerationSprites(genSprites);
        setUserUseSpritesInTeamTable(teamTableSprites);
      })
      .catch(() => {
        setUserUseGenerationSprites(false);
        setUserUseSpritesInTeamTable(false);
      });
  }, [user]);

  useEffect(() => {
    // Don't redirect away from tracker route while we are still resolving whether it is public
    if (user || loading) return;

    if (!routeTrackerId) {
      navigate("/", { replace: true });
      return;
    }

    if (isViewingPublicTracker || publicTrackerLoading) return;
    const routeTrackerMeta = trackerMetas[routeTrackerId];
    if (!routeTrackerMeta || !routeTrackerMeta.isPublic) {
      navigate("/", { replace: true });
    }
  }, [
    user,
    loading,
    navigate,
    routeTrackerId,
    publicTrackerLoading,
    trackerMetas,
    isViewingPublicTracker,
  ]);

  useEffect(() => {
    if (!location.pathname.startsWith("/tracker") && showSettings) {
      closeSettingsPanel();
    }
  }, [location.pathname, showSettings, closeSettingsPanel]);

  useEffect(() => {
    if (!user) {
      setUserTrackerIds([]);
      setTrackerMetas({});
      metaListenersRef.current.forEach((unsub) => unsub());
      metaListenersRef.current.clear();
      setActiveTrackerId(null);
      setUserTrackersLoading(false);
      return;
    }

    setUserTrackersLoading(true);
    const userTrackersRef = ref(db, `userTrackers/${user.uid}`);
    const unsubscribe = onValue(
      userTrackersRef,
      (snapshot) => {
        const ids = snapshot.exists() ? Object.keys(snapshot.val()) : [];
        setUserTrackerIds(ids);
        setUserTrackersLoading(false);
      },
      () => setUserTrackersLoading(false),
    );

    return () => {
      unsubscribe();
      setUserTrackersLoading(false);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const listeners = metaListenersRef.current;
    for (const [trackerId, unsub] of listeners.entries()) {
      if (!userTrackerIds.includes(trackerId)) {
        unsub();
        listeners.delete(trackerId);
        setTrackerMetas((prev) => {
          const next = { ...prev };
          delete next[trackerId];
          return next;
        });
      }
    }

    userTrackerIds.forEach((trackerId) => {
      if (listeners.has(trackerId)) return;
      const metaRef = ref(db, `trackers/${trackerId}/meta`);
      const unsubscribe = onValue(
        metaRef,
        (snapshot) => {
          const meta = snapshot.val();
          setTrackerMetas((prev) => {
            const next = { ...prev };
            if (meta) {
              next[trackerId] = { ...meta, id: trackerId };
            } else {
              delete next[trackerId];
            }
            return next;
          });
        },
        () => {
          setTrackerMetas((prev) => {
            const next = { ...prev };
            delete next[trackerId];
            return next;
          });
        },
      );
      listeners.set(trackerId, unsubscribe);
    });

    return () => {
      if (!user) {
        listeners.forEach((unsub) => unsub());
        listeners.clear();
      }
    };
  }, [userTrackerIds, user]);

  useEffect(() => {
    if (!user) {
      trackerStateListenersRef.current.forEach((unsub) => unsub());
      trackerStateListenersRef.current.clear();
      setTrackerSummaries({});
      return;
    }

    const listeners = trackerStateListenersRef.current;
    for (const [trackerId, unsubscribe] of listeners.entries()) {
      if (!userTrackerIds.includes(trackerId)) {
        unsubscribe();
        listeners.delete(trackerId);
        setTrackerSummaries((prev) => {
          const next = { ...prev };
          delete next[trackerId];
          return next;
        });
      }
    }

    userTrackerIds.forEach((trackerId) => {
      if (listeners.has(trackerId)) return;
      const stateRef = ref(db, `trackers/${trackerId}/state`);
      const unsubscribe = onValue(
        stateRef,
        (snapshot) => {
          const stateValue = snapshot.val();
          setTrackerSummaries((prev) => ({
            ...prev,
            [trackerId]: computeTrackerSummary(stateValue),
          }));
        },
        () => {
          setTrackerSummaries((prev) => {
            const next = { ...prev };
            delete next[trackerId];
            return next;
          });
        },
      );
      listeners.set(trackerId, unsubscribe);
    });

    return () => {
      if (!user) {
        listeners.forEach((unsub) => unsub());
        listeners.clear();
      }
    };
  }, [user, userTrackerIds]);

  // Load tracker metadata for direct URL access (used for public trackers)
  useEffect(() => {
    if (!routeTrackerId) {
      setPublicTrackerLoading(false);
      return;
    }

    // When the user already has this tracker in their list, metadata is handled
    // by the userTrackers listener above.
    if (user && userTrackerIds.includes(routeTrackerId)) {
      setPublicTrackerLoading(false);
      return;
    }

    setPublicTrackerLoading(true);
    const metaRef = ref(db, `trackers/${routeTrackerId}/meta`);
    const unsubscribe = onValue(
      metaRef,
      (snapshot) => {
        const meta = snapshot.val();
        if (meta && meta.isPublic) {
          setTrackerMetas((prev) => ({
            ...prev,
            [routeTrackerId]: { ...meta, id: routeTrackerId },
          }));
          setActiveTrackerId(routeTrackerId);
        } else {
          setTrackerMetas((prev) => {
            const next = { ...prev };
            delete next[routeTrackerId];
            return next;
          });
          setActiveTrackerId(null);
        }
        setPublicTrackerLoading(false);
      },
      () => {
        // Error handling - tracker doesn't exist or can't be read
        setTrackerMetas((prev) => {
          const next = { ...prev };
          delete next[routeTrackerId];
          return next;
        });
        setActiveTrackerId(null);
        setPublicTrackerLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user, routeTrackerId, userTrackerIds]);

  useEffect(() => {
    if (!user) {
      // Don't clear activeTrackerId if it's a public tracker
      if (!activeTrackerMeta?.isPublic) {
        setActiveTrackerId(null);
      }
      return;
    }
    if (userTrackersLoading) return;

    if (routeTrackerId) {
      const isUserTracker = userTrackerIds.includes(routeTrackerId);
      const routeMeta = trackerMetas[routeTrackerId];
      const isPublicRouteTracker = Boolean(routeMeta?.isPublic);

      if (isUserTracker || isPublicRouteTracker) {
        if (activeTrackerId !== routeTrackerId) {
          setActiveTrackerId(routeTrackerId);
        }
      } else if (activeTrackerId !== null) {
        setActiveTrackerId(null);
      }
      return;
    }

    if (activeTrackerId && !userTrackerIds.includes(activeTrackerId)) {
      setActiveTrackerId(null);
      return;
    }

    if (!activeTrackerId) {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(LAST_TRACKER_STORAGE_KEY)
          : null;
      if (stored && userTrackerIds.includes(stored)) {
        setActiveTrackerId(stored);
      }
    }
  }, [
    userTrackerIds,
    activeTrackerId,
    user,
    userTrackersLoading,
    routeTrackerId,
  ]);

  useEffect(() => {
    if (!user) return;
    if (activeTrackerId) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_TRACKER_STORAGE_KEY, activeTrackerId);
      }
    } else if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
    }
  }, [activeTrackerId, user]);

  // Keep local isDark in sync with document class/localStorage
  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(getDarkMode()));
    observer.observe(target, { attributes: true, attributeFilter: ["class"] });
    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-theme") setIsDark(getDarkMode());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const routeTrackerExistsForUser =
    user && routeTrackerId ? userTrackerIds.includes(routeTrackerId) : false;
  const routeTrackerIsPublic = routeTrackerId
    ? Boolean(trackerMetas[routeTrackerId]?.isPublic)
    : false;
  const routeTrackerKnownMissing = Boolean(
    user &&
      routeTrackerId &&
      !userTrackersLoading &&
      !routeTrackerExistsForUser &&
      !routeTrackerIsPublic &&
      !publicTrackerLoading,
  );
  const routeTrackerPendingSelection = user
    ? Boolean(
        routeTrackerId &&
          !routeTrackerKnownMissing &&
          (userTrackersLoading || activeTrackerId !== routeTrackerId),
      )
    : false;

  useEffect(() => {
    isHydratingRef.current = true;
    const gameVersionId = activeGameVersionId;
    if (!user && !isViewingPublicTracker) {
      setData(createInitialState());
      setDataLoaded(false);
      isHydratingRef.current = false;
      return;
    }

    if (!isViewingPublicTracker && routeTrackerPendingSelection) {
      setData(createInitialState());
      setDataLoaded(false);
      return;
    }

    if (!isViewingPublicTracker && routeTrackerKnownMissing) {
      setData(createInitialState());
      setDataLoaded(true);
      isHydratingRef.current = false;
      return;
    }

    if (!activeTrackerId) {
      setData(createInitialState());
      setDataLoaded(true);
      isHydratingRef.current = false;
      return;
    }

    const dbRef = ref(db, `trackers/${activeTrackerId}/state`);
    let unsub: (() => void) | undefined;
    let cancelled = false;
    let initialSnapshotApplied = false;
    const markInitialSnapshot = () => {
      if (!initialSnapshotApplied) {
        initialSnapshotApplied = true;
        isHydratingRef.current = false;
        setDataLoaded(true);
      }
    };

    (async () => {
      try {
        const snapshot = await get(dbRef);
        if (cancelled) return;
        const dbData = snapshot.val();
        if (dbData) {
          skipNextWriteRef.current = true;
          setData((prev) => coerceAppState(dbData, prev));
        } else {
          setData(createInitialState(gameVersionId));
        }
        markInitialSnapshot();
      } catch (e) {
        console.error("Tracker state fetch failed", e);
        setData(createInitialState(gameVersionId));
      } finally {
        if (!cancelled) {
          unsub = onValue(
            dbRef,
            (snap) => {
              const liveData = snap.val();
              if (liveData) {
                skipNextWriteRef.current = true;
                setData((prev) => coerceAppState(liveData, prev));
              }
              markInitialSnapshot();
            },
            (error) => {
              console.error("Tracker state listener error", error);
            },
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
      isHydratingRef.current = true;
      setDataLoaded(false);
    };
  }, [
    user,
    activeTrackerId,
    activeGameVersionId,
    coerceAppState,
    routeTrackerPendingSelection,
    routeTrackerKnownMissing,
    isViewingPublicTracker,
  ]);

  useEffect(() => {
    if (!user || !dataLoaded || !activeTrackerId || isHydratingRef.current)
      return;

    if (skipNextWriteRef.current) {
      // Skip echoing writes caused by remote updates
      skipNextWriteRef.current = false;
      return;
    }

    const dbRef = ref(db, `trackers/${activeTrackerId}/state`);
    pendingWriteRef.current = pendingWriteRef.current
      .then(() => set(dbRef, data))
      .catch((error) => {
        console.error("Tracker state write failed", error);
      });
  }, [data, user, dataLoaded, activeTrackerId]);

  useEffect(() => {
    pendingWriteRef.current = Promise.resolve();
  }, [activeTrackerId, user]);

  const handleReset = () => {
    if (isReadOnly) return;
    setShowResetModal(true);
  };

  const handleConfirmReset = () => {
    if (isReadOnly) return;
    const gameVersionId = activeGameVersionId;
    setData((prev) => {
      const playerNames =
        prev.playerNames.length > 0
          ? sanitizePlayerNames(prev.playerNames)
          : sanitizePlayerNames(activeTrackerMeta?.playerNames);
      const base = createInitialState(gameVersionId, playerNames);
      const playerCount = playerNames.length;
      const makeZeroArray = () => Array.from({ length: playerCount }, () => 0);
      const summedDeaths = Array.from(
        { length: playerCount },
        (_, index) =>
          (prev.stats.sumDeaths?.[index] ?? 0) +
          (prev.stats.deaths?.[index] ?? 0),
      );
      const prevCurrentBest = Array.isArray(prev.levelCaps)
        ? prev.levelCaps.filter((c) => c && (c as any).done).length
        : 0;
      const newBest = Math.max(prev.stats.best ?? 0, prevCurrentBest);

      return {
        ...base,
        rules: prev.rules, // keep rule changes
        // keep toggled settings
        legendaryTrackerEnabled: prev.legendaryTrackerEnabled,
        rivalCensorEnabled: prev.rivalCensorEnabled,
        hardcoreModeEnabled: prev.hardcoreModeEnabled,
        infiniteFossilsEnabled: prev.infiniteFossilsEnabled,
        stats: {
          runs: prev.stats.runs + 1, // increase run number by 1
          best: newBest, // persistiertes best
          top4Items: makeZeroArray(),
          deaths: makeZeroArray(),
          sumDeaths: summedDeaths,
          legendaryEncounters: prev.stats.legendaryEncounters ?? 0,
        },
        runStartedAt: Date.now(),
      };
    });
    setShowResetModal(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    closeSettingsPanel();
    setActiveTrackerId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
    }
    navigate("/");
    signOut(auth);
  };

  const handleOpenUserSettings = useCallback(() => {
    setMobileMenuOpen(false);
    navigate("/account");
  }, [navigate]);

  const handleNavigateHome = () => {
    setMobileMenuOpen(false);
    navigate("/");
  };

  const updateLinkMember = useCallback(
    (
      key: "team" | "box",
      index: number,
      playerIndex: number,
      field: keyof Pokemon,
      value: string,
    ) => {
      if (isReadOnly) return;
      setData((prev) => {
        const list = [...prev[key]];
        const target = list[index];
        if (!target) return prev;
        const members = [...target.members];
        members[playerIndex] = {
          ...(members[playerIndex] ?? { name: "", nickname: "" }),
          [field]: value,
        };
        list[index] = { ...target, members };
        return { ...prev, [key]: list };
      });
    },
    [isReadOnly],
  );

  const updateLinkRoute = useCallback(
    (key: "team" | "box", index: number, value: string) => {
      if (isReadOnly) return;
      setData((prev) => {
        const list = [...prev[key]];
        const target = list[index];
        if (!target) return prev;
        list[index] = { ...target, route: value };
        return { ...prev, [key]: list };
      });
    },
    [isReadOnly],
  );

  const handleTeamChange = useCallback(
    (
      index: number,
      playerIndex: number,
      field: keyof Pokemon,
      value: string,
    ) => {
      updateLinkMember("team", index, playerIndex, field, value);
    },
    [updateLinkMember],
  );

  const handleRouteChange = useCallback(
    (index: number, value: string) => {
      updateLinkRoute("team", index, value);
    },
    [updateLinkRoute],
  );

  const handleBoxChange = useCallback(
    (
      index: number,
      playerIndex: number,
      field: keyof Pokemon,
      value: string,
    ) => {
      updateLinkMember("box", index, playerIndex, field, value);
    },
    [updateLinkMember],
  );

  const handleBoxRouteChange = useCallback(
    (index: number, value: string) => {
      updateLinkRoute("box", index, value);
    },
    [updateLinkRoute],
  );

  const handleLevelCapToggle = useCallback(
    (index: number) => {
      if (isReadOnly) return;
      setData((prev) => ({
        ...prev,
        levelCaps: prev.levelCaps.map((c, i) =>
          i === index ? { ...c, done: !c.done } : c,
        ),
      }));
    },
    [isReadOnly],
  );

  const handleRivalCapToggleDone = useCallback(
    (index: number) => {
      if (isReadOnly) return;
      setData((prev) => ({
        ...prev,
        rivalCaps: prev.rivalCaps.map((rc, i) =>
          i === index ? { ...rc, done: !rc.done } : rc,
        ),
      }));
    },
    [isReadOnly],
  );

  const handleRivalCapReveal = useCallback(
    (index: number) => {
      if (isReadOnly) return;
      setData((prev) => ({
        ...prev,
        rivalCaps: prev.rivalCaps.map((rc, i) =>
          i === index ? { ...rc, revealed: true } : rc,
        ),
      }));
    },
    [isReadOnly],
  );

  const handleStatChange = (stat: keyof AppState["stats"], value: string) => {
    if (isReadOnly) return;
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setData((prev) => ({
        ...prev,
        stats: { ...prev.stats, [stat]: numValue },
      }));
    }
  };

  const handlePlayerStatChange = (
    group: keyof AppState["stats"],
    playerIndex: number,
    value: string,
  ) => {
    if (isReadOnly) return;
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    setData((prev) => {
      const target = prev.stats[group];
      if (!Array.isArray(target)) return prev;
      const updated = target.map((entry, index) =>
        index === playerIndex ? numValue : entry,
      );
      return {
        ...prev,
        stats: {
          ...prev.stats,
          [group]: updated,
        },
      };
    });
  };

  const handleAddToGraveyard = useCallback(
    (pair: PokemonLink) => {
      if (isReadOnly) return;
      setPendingLossPair(pair);
      setShowLossModal(true);
    },
    [isReadOnly],
  );

  const handleConfirmLoss = (playerIndex: number) => {
    if (isReadOnly || !pendingLossPair) return;
    if (!pendingLossPair) return;
    const pair = { ...pendingLossPair, isLost: false };
    setData((prev) => ({
      ...prev,
      graveyard: [...prev.graveyard, pair],
      team: prev.team.filter((p) => p.id !== pair.id),
      box: prev.box.filter((p) => p.id !== pair.id),
      stats: {
        ...prev.stats,
        deaths: prev.stats.deaths.map((count, index) =>
          index === playerIndex ? Number(count || 0) + 1 : count,
        ),
      },
    }));
    setShowLossModal(false);
    setPendingLossPair(null);
  };

  const handleManualAddToGraveyard = (pair: PokemonLink) => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      graveyard: [...prev.graveyard, pair],
    }));
  };

  const handleManualAddFromModal = (route: string, members: Pokemon[]) => {
    if (isReadOnly) return;
    const newPair: PokemonLink = {
      id: Date.now(),
      route: route.trim(),
      members: members.map((member) => ({
        name: member.name.trim(),
        nickname: "",
      })),
      isLost: true,
    };
    handleManualAddToGraveyard(newPair);
    setIsModalOpen(false);
  };

  const handleEditGraveyardPair = (
    pairId: number,
    payload: { route: string; members: Pokemon[] },
  ) => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      graveyard: prev.graveyard.map((pair) => {
        if (pair.id !== pairId) return pair;
        const isLost = pair.isLost ?? false;
        const members = payload.members.map((member) => ({
          name: member.name.trim(),
          nickname: isLost ? "" : member.nickname.trim(),
        }));
        return {
          ...pair,
          route: payload.route.trim(),
          members,
          isLost,
        };
      }),
    }));
  };

  const handleAddTeamPair = (payload: {
    route: string;
    members: Pokemon[];
  }) => {
    if (isReadOnly) return;
    setData((prev) => {
      if (prev.team.length >= 6) return prev; // enforce 6 max
      return {
        ...prev,
        team: [
          ...prev.team,
          {
            id: Date.now(),
            route: payload.route.trim(),
            members: payload.members.map((member) => ({
              name: member.name.trim(),
              nickname: member.nickname.trim(),
            })),
          },
        ],
      };
    });
  };

  const handleAddBoxPair = (payload: { route: string; members: Pokemon[] }) => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      box: [
        ...prev.box,
        {
          id: Date.now(),
          route: payload.route.trim(),
          members: payload.members.map((member) => ({
            name: member.name.trim(),
            nickname: member.nickname.trim(),
          })),
        },
      ],
    }));
  };

  const syncActiveMetaPlayerNames = useCallback(
    (names: string[]) => {
      if (!activeTrackerId || isReadOnly) return;
      setTrackerMetas((prev) => {
        const existing = prev[activeTrackerId];
        if (!existing) return prev;
        return {
          ...prev,
          [activeTrackerId]: {
            ...existing,
            playerNames: names,
          },
        };
      });
      update(ref(db, `trackers/${activeTrackerId}/meta`), {
        playerNames: names,
      }).catch(() => {});
    },
    [activeTrackerId, isReadOnly],
  );

  const handlePlayerNameChange = (index: number, name: string) => {
    if (isReadOnly) return;
    setData((prev) => {
      const playerNames = [...prev.playerNames];
      playerNames[index] = name;
      syncActiveMetaPlayerNames(playerNames);
      return { ...prev, playerNames };
    });
  };

  const handleTitleChange = (title: string) => {
    if (!activeTrackerId || isReadOnly) return;
    setTrackerMetas((prev) => {
      const existing = prev[activeTrackerId];
      if (!existing) return prev;
      return {
        ...prev,
        [activeTrackerId]: {
          ...existing,
          title,
        },
      };
    });
    update(ref(db, `trackers/${activeTrackerId}/meta`), { title });
  };

  const handleLegendaryTrackerToggle = (enabled: boolean) => {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, legendaryTrackerEnabled: enabled }));
  };

  const handleRivalCensorToggle = (enabled: boolean) => {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, rivalCensorEnabled: enabled }));
  };

  const handleHardcoreModeToggle = (enabled: boolean) => {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, hardcoreModeEnabled: enabled }));
  };

  const handleInfiniteFossilsToggle = (enabled: boolean) => {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, infiniteFossilsEnabled: enabled }));
  };

  const handleAddFossil = (
    pIdx: number,
    fossilId: string,
    location: string,
    inBag: boolean,
  ) => {
    if (isReadOnly) return;
    setData((prev) => {
      const newFossils = [...(prev.fossils || prev.playerNames.map(() => []))];
      const playerList = Array.isArray(newFossils[pIdx])
        ? [...newFossils[pIdx]]
        : [];
      newFossils[pIdx] = [
        ...playerList,
        { fossilId, location, inBag, revived: false },
      ];
      return { ...prev, fossils: newFossils };
    });
  };

  const handleToggleFossilBag = (pIdx: number, fIdx: number) => {
    if (isReadOnly) return;
    setData((prev) => {
      const newFossils = [...(prev.fossils || [])];
      if (!newFossils[pIdx]) return prev;
      newFossils[pIdx] = newFossils[pIdx].map((f, i) =>
        i === fIdx ? { ...f, inBag: true, location: "" } : f,
      );
      return { ...prev, fossils: newFossils };
    });
  };

  const handleReviveFossils = (selectedIndices: number[]) => {
    if (isReadOnly || !data.fossils) return;

    const selectedFossils = selectedIndices.map(
      (fIdx, pIdx) => data.fossils![pIdx][fIdx],
    );
    const areaName = selectedFossils
      .map((f) => t(`fossils.${f.fossilId}`))
      .join("/");

    setReviveArea(areaName);
    setPendingReviveIndices(selectedIndices);
    setAddRevivedPokemonOpen(true);
  };

  const confirmRevival = (revivedNames: string[]) => {
    if (!pendingReviveIndices) return;

    setData((prev) => {
      const newFossils = [...(prev.fossils || [])];
      pendingReviveIndices.forEach((fIdx, pIdx) => {
        if (newFossils[pIdx] && newFossils[pIdx][fIdx]) {
          newFossils[pIdx] = newFossils[pIdx].map((f, i) =>
            i === fIdx
              ? { ...f, revived: true, pokemonName: revivedNames[pIdx] }
              : f,
          );
        }
      });
      return { ...prev, fossils: newFossils };
    });

    setPendingReviveIndices(null);
  };

  const handlePublicToggle = (enabled: boolean) => {
    if (!activeTrackerId || isReadOnly) return;
    setTrackerMetas((prev) => {
      const existing = prev[activeTrackerId];
      if (!existing) return prev;
      return {
        ...prev,
        [activeTrackerId]: {
          ...existing,
          isPublic: enabled,
        },
      };
    });
    update(ref(db, `trackers/${activeTrackerId}/meta`), { isPublic: enabled });
  };

  const handleLegendaryIncrement = () => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        legendaryEncounters: (prev.stats.legendaryEncounters ?? 0) + 1,
      },
    }));
  };

  const handleLegendaryDecrement = () => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        legendaryEncounters: Math.max(
          0,
          (prev.stats.legendaryEncounters ?? 0) - 1,
        ),
      },
    }));
  };

  const openCreateTrackerModal = () => {
    setCreateTrackerError(null);
    setShowCreateModal(true);
  };

  const handleOpenTracker = (trackerId: string) => {
    setActiveTrackerId(trackerId);
    navigate(`/tracker/${trackerId}`);
  };

  const handleCreateTrackerSubmit = async (payload: {
    title: string;
    playerNames: string[];
    memberInvites: Array<{ email: string; role: "editor" | "guest" }>;
    gameVersionId: string;
  }) => {
    if (!user) return;
    setCreateTrackerError(null);
    setCreateTrackerLoading(true);
    try {
      await createTracker({
        title: payload.title,
        playerNames: payload.playerNames,
        memberInvites: payload.memberInvites,
        owner: user,
        gameVersionId: payload.gameVersionId,
      });
      setShowCreateModal(false);
    } catch (error) {
      if (
        error instanceof TrackerOperationError &&
        error.code === "user-not-found" &&
        Array.isArray(error.details)
      ) {
        setCreateTrackerError(
          `Folgende Emails wurden nicht gefunden: ${error.details.join(", ")}`,
        );
      } else {
        setCreateTrackerError(
          error instanceof Error
            ? error.message
            : "Tracker konnte nicht erstellt werden.",
        );
      }
    } finally {
      setCreateTrackerLoading(false);
    }
  };

  const handleRequestTrackerDeletion = useCallback(
    (trackerId: string) => {
      if (!user) return;
      const meta = trackerMetas[trackerId];
      if (!meta) return;
      const role = meta.members?.[user.uid]?.role;
      if (role !== "owner") return;
      setDeleteTrackerError(null);
      setTrackerPendingDelete(meta);
    },
    [trackerMetas, user],
  );

  const handleCloseDeleteModal = () => {
    if (deleteTrackerLoading) return;
    setTrackerPendingDelete(null);
    setDeleteTrackerError(null);
  };

  const handleDeleteTracker = useCallback(async () => {
    if (!trackerPendingDelete) return;
    setDeleteTrackerError(null);
    setDeleteTrackerLoading(true);
    try {
      await deleteTracker(trackerPendingDelete.id);
      if (trackerPendingDelete.id === activeTrackerId) {
        setActiveTrackerId(null);
        setData(createInitialState());
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
        }
        navigate("/");
      }
      setTrackerPendingDelete(null);
    } catch (error) {
      setDeleteTrackerError(
        error instanceof Error
          ? error.message
          : "Tracker konnte nicht gelöscht werden.",
      );
    } finally {
      setDeleteTrackerLoading(false);
    }
  }, [trackerPendingDelete, activeTrackerId, navigate]);

  const handleInviteMember = useCallback(
    async (email: string, role: "editor" | "guest") => {
      if (!activeTrackerId) {
        throw new Error("Kein aktiver Tracker ausgewählt.");
      }
      try {
        await addMemberByEmail(activeTrackerId, email, role);
      } catch (error) {
        if (error instanceof TrackerOperationError) {
          const details = Array.isArray(error.details)
            ? ` (${error.details.join(", ")})`
            : "";
          throw new Error(`${error.message}${details}`);
        }
        throw new Error("Mitglied konnte nicht hinzugefügt werden.");
      }
    },
    [activeTrackerId],
  );

  const handleRemoveMember = useCallback(
    async (memberUid: string) => {
      if (!activeTrackerId) {
        throw new Error("Kein aktiver Tracker ausgewählt.");
      }
      try {
        await removeMemberFromTracker(activeTrackerId, memberUid);
        if (user && memberUid === user.uid) {
          closeSettingsPanel();
          setActiveTrackerId(null);
          setData(createInitialState());
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
          }
          navigate("/");
        }
      } catch (error) {
        if (error instanceof TrackerOperationError) {
          throw new Error(error.message);
        }
        throw new Error("Mitglied konnte nicht entfernt werden.");
      }
    },
    [activeTrackerId, user, navigate, closeSettingsPanel],
  );

  const clearedRoutes = useMemo(() => {
    const routes: string[] = [];
    const collect = (arr: PokemonLink[] | undefined | null) => {
      const list = Array.isArray(arr) ? arr : [];
      for (const p of list) {
        const r = (p?.route || "").trim();
        if (r) routes.push(r);
      }
    };
    collect(data?.team);
    collect(data?.box);
    collect(data?.graveyard);
    return Array.from(new Set(routes)).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const trackerList = useMemo(
    () =>
      userTrackerIds
        .map((id) => trackerMetas[id])
        .filter((meta): meta is TrackerMeta => Boolean(meta)),
    [userTrackerIds, trackerMetas],
  );
  const trackerListLoading =
    userTrackersLoading ||
    (userTrackerIds.length > 0 && trackerList.length === 0);

  const trackerMembers = activeTrackerMeta
    ? Object.values(activeTrackerMeta.members ?? {})
    : [];
  const trackerGuests = activeTrackerMeta
    ? Object.values(activeTrackerMeta.guests ?? {})
    : [];
  const canManageMembers = Boolean(
    user && activeTrackerMeta?.members?.[user.uid]?.role === "owner",
  );

  useEffect(() => {
    if (isReadOnly && !isGuest && showSettings) {
      closeSettingsPanel();
    }
  }, [isReadOnly, isGuest, showSettings, closeSettingsPanel]);

  const resolvedPlayerNames = useMemo(() => {
    if (Array.isArray(data.playerNames) && data.playerNames.length > 0) {
      return data.playerNames;
    }
    if (
      Array.isArray(activeTrackerMeta?.playerNames) &&
      activeTrackerMeta.playerNames.length > 0
    ) {
      return sanitizePlayerNames(activeTrackerMeta.playerNames);
    }
    return [];
  }, [data.playerNames, activeTrackerMeta?.playerNames]);

  const playerColors = useMemo(
    () => resolvedPlayerNames.map((_, index) => PLAYER_COLORS[index]),
    [resolvedPlayerNames],
  );

  // Backfill runStartedAt for legacy trackers once
  useEffect(() => {
    if (!user || !dataLoaded || !activeTrackerId) return;
    const hasRunStarted =
      typeof data.runStartedAt === "number" && data.runStartedAt > 0;
    const metaCreated =
      typeof activeTrackerMeta?.createdAt === "number"
        ? activeTrackerMeta.createdAt
        : 0;
    if (!hasRunStarted && metaCreated > 0) {
      setData((prev) => ({ ...prev, runStartedAt: metaCreated }));
    }
  }, [
    user,
    dataLoaded,
    activeTrackerId,
    data.runStartedAt,
    activeTrackerMeta?.createdAt,
  ]);

  const nameTitleFallback = resolvedPlayerNames
    .map((n) => n?.trim())
    .filter(Boolean)
    .join(" • ");
  const trackerTitleDisplay =
    activeTrackerMeta?.title?.trim() ||
    nameTitleFallback ||
    t("common.appName");
  const isPublicTracker = Boolean(activeTrackerMeta?.isPublic);
  const readOnlyNotice = isReadOnly
    ? isGuest
      ? t("app.guestReadOnlyNotice")
      : isPublicTracker
        ? t("app.publicReadOnlyNotice")
        : null
    : null;

  if (isPasswordResetRoute) {
    return <PasswordResetPage oobCode={passwordResetOobCode} />;
  }

  // Show loading while auth is initializing, or while the target tracker is still resolving/loading
  // For public trackers when not logged in, also wait for data to load
  if (
    loading ||
    ((user || isViewingPublicTracker) &&
      (!dataLoaded || routeTrackerPendingSelection)) ||
    publicTrackerLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] dark:bg-gray-900">
        <div
          className="flex flex-col items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 border-4 border-gray-300 dark:border-gray-600 dark:border-t-blue-600 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {t("common.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (!user && !isViewingPublicTracker) {
    return authScreen === "login" ? (
      <LoginPage onSwitchToRegister={() => setAuthScreen("register")} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthScreen("login")} />
    );
  }

  const trackerElement = !activeTrackerId ? (
    routeTrackerKnownMissing ? (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f0] dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-6 text-center">
        <p className="text-lg font-semibold">
          {t("app.trackerNotFound.title")}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {t("app.trackerNotFound.description")}
        </p>
        <button
          onClick={handleNavigateHome}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {t("common.overview")}
        </button>
      </div>
    ) : (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f0] dark:bg-gray-900 text-gray-700 dark:text-gray-200">
        <p className="text-lg font-semibold">
          {t("app.noTrackerSelected.title")}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {t("app.noTrackerSelected.description")}
        </p>
        <button
          onClick={handleNavigateHome}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {t("common.overview")}
        </button>
      </div>
    )
  ) : showSettings ? (
    <SettingsPage
      trackerTitle={activeTrackerMeta?.title ?? t("tracker.defaultTitle")}
      onTitleChange={handleTitleChange}
      playerNames={resolvedPlayerNames}
      onPlayerNameChange={handlePlayerNameChange}
      onBack={closeSettingsPanel}
      legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
      onlegendaryTrackerToggle={handleLegendaryTrackerToggle}
      rivalCensorEnabled={data.rivalCensorEnabled ?? true}
      onRivalCensorToggle={handleRivalCensorToggle}
      hardcoreModeEnabled={data.hardcoreModeEnabled ?? true}
      onHardcoreModeToggle={handleHardcoreModeToggle}
      infiniteFossilsEnabled={data.infiniteFossilsEnabled ?? false}
      onInfiniteFossilsToggle={handleInfiniteFossilsToggle}
      isPublic={activeTrackerMeta?.isPublic ?? false}
      onPublicToggle={handlePublicToggle}
      members={trackerMembers}
      guests={trackerGuests}
      onInviteMember={handleInviteMember}
      onRemoveMember={handleRemoveMember}
      onRequestDeleteTracker={() => {
        if (activeTrackerId) {
          handleRequestTrackerDeletion(activeTrackerId);
        }
      }}
      canManageMembers={canManageMembers}
      currentUserEmail={user?.email}
      currentUserId={user?.uid}
      gameVersion={activeGameVersion}
      rivalPreferences={currentUserRivalPreferences}
      onRivalPreferenceChange={handleRivalPreferenceChange}
      isGuest={isGuest}
    />
  ) : (
    <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 text-gray-800 dark:text-gray-200">
      <AddLostPokemonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleManualAddFromModal}
        playerNames={resolvedPlayerNames}
        generationLimit={pokemonGenerationLimit}
        generationSpritePath={generationSpritePath}
        gameVersionId={activeGameVersionId || undefined}
      />
      <SelectLossModal
        isOpen={!isReadOnly && showLossModal}
        onClose={() => {
          setShowLossModal(false);
          setPendingLossPair(null);
        }}
        onConfirm={handleConfirmLoss}
        pair={pendingLossPair}
        playerNames={resolvedPlayerNames}
      />
      <ResetModal
        isOpen={!isReadOnly && showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
      />
      {readOnlyNotice && (
        <div className="max-w-[1920px] mx-auto mt-3 mb-3 bg-blue-50 border border-blue-200 text-blue-800 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-100 rounded-md px-3 py-2 text-sm shadow-sm">
          {readOnlyNotice}
        </div>
      )}
      <div className="max-w-[1920px] mx-auto bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg">
        <header className="relative text-center py-4 border-b-2 border-gray-300 dark:border-gray-700">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-bold font-press-start tracking-tighter dark:text-gray-100">
            {trackerTitleDisplay}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("tracker.header.subtitle")}
          </p>
          <div className="absolute right-2 sm:right-4 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
            {/* Desktop icons (>=xl) */}
            <div className="hidden xl:flex items-center gap-1 sm:gap-2">
              <DarkModeToggle />
              <button
                onClick={handleNavigateHome}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
                aria-label={t("common.overview")}
                title={t("common.overview")}
              >
                <FiHome size={28} />
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleReset}
                  className="p-2 rounded-full focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  aria-label={t("tracker.actions.resetRun")}
                  title={t("tracker.actions.resetRun")}
                >
                  <FiRotateCw size={28} />
                </button>
              )}
              {(!isReadOnly || isGuest) && (
                <button
                  onClick={openSettingsPanel}
                  className="p-2 rounded-full focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  aria-label={t("tracker.actions.settings")}
                  title={t("tracker.actions.settings")}
                >
                  <FiSettings size={28} />
                </button>
              )}
            </div>
            {/* Mobile burger (<xl) */}
            <button
              className="xl:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none"
              aria-label={t("tracker.menu.open")}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <FiMenu size={26} />
            </button>
          </div>
        </header>

        {/* Mobile side drawer + backdrop */}
        <div className="xl:hidden">
          {/* Backdrop for outside click */}
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} z-40`}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          {/* Sliding panel */}
          <div
            className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"} z-50`}
            role="dialog"
            aria-label={t("tracker.menu.dialog")}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t("tracker.menu.title")}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                aria-label={t("tracker.menu.close")}
              >
                ✕
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  const next = !isDark;
                  setDarkMode(next);
                  setIsDark(next);
                }}
                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                title={
                  isDark
                    ? t("tracker.menu.lightMode")
                    : t("tracker.menu.darkMode")
                }
              >
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                {isDark
                  ? t("tracker.menu.lightMode")
                  : t("tracker.menu.darkMode")}
              </button>
              <button
                onClick={handleNavigateHome}
                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                title={t("common.overview")}
              >
                <FiHome size={18} /> {t("tracker.menu.overview")}
              </button>
              {!isReadOnly && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleReset();
                  }}
                  className="w-full text-left px-2 py-2 rounded-md text-sm inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={t("tracker.menu.resetRun")}
                >
                  <FiRotateCw size={18} /> {t("tracker.menu.resetRun")}
                </button>
              )}
              {(!isReadOnly || isGuest) && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSettingsPanel();
                  }}
                  className="w-full text-left px-2 py-2 rounded-md text-sm inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={t("tracker.menu.settings")}
                >
                  <FiSettings size={18} /> {t("tracker.menu.settings")}
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="grid grid-cols-1 xl:grid-cols-[64fr_36fr] gap-6 mt-6">
          <div className="space-y-8">
            <TeamTable
              title={t("team.teamTitle")}
              data={data.team}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onPokemonChange={handleTeamChange}
              onRouteChange={handleRouteChange}
              onAddToGraveyard={handleAddToGraveyard}
              onAddLink={handleAddTeamPair}
              emptyMessage={t("team.teamEmpty")}
              addDisabled={data.team.length >= 6}
              addDisabledReason={t("team.teamFull")}
              context="team"
              onMoveToTeam={() => {}}
              onMoveToBox={(pair) => {
                if (isReadOnly) return;
                setData((prev) => ({
                  ...prev,
                  team: prev.team.filter((p) => p.id !== pair.id),
                  box: [...prev.box, pair],
                }));
              }}
              pokemonGenerationLimit={pokemonGenerationLimit}
              gameVersionId={activeGameVersionId || undefined}
              readOnly={isReadOnly}
              generationSpritePath={generationSpritePath}
              useSpritesInTeamTable={userUseSpritesInTeamTable}
            />
            <TeamTable
              title={t("team.boxTitle")}
              data={data.box}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onPokemonChange={handleBoxChange}
              onRouteChange={handleBoxRouteChange}
              onAddToGraveyard={handleAddToGraveyard}
              onAddLink={handleAddBoxPair}
              emptyMessage={t("team.boxEmpty")}
              context="box"
              onMoveToTeam={(pair) =>
                setData((prev) => {
                  if (isReadOnly || prev.team.length >= 6) return prev;
                  return {
                    ...prev,
                    box: prev.box.filter((p) => p.id !== pair.id),
                    team: [...prev.team, pair],
                  };
                })
              }
              onMoveToBox={() => {}}
              teamIsFull={data.team.length >= 6}
              pokemonGenerationLimit={pokemonGenerationLimit}
              gameVersionId={activeGameVersionId || undefined}
              readOnly={isReadOnly}
              generationSpritePath={generationSpritePath}
              useSpritesInTeamTable={userUseSpritesInTeamTable}
            />
          </div>

          <div className="space-y-6">
            <InfoPanel
              levelCaps={data.levelCaps}
              rivalCaps={data.rivalCaps}
              stats={data.stats}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onLevelCapToggle={handleLevelCapToggle}
              onRivalCapToggleDone={handleRivalCapToggleDone}
              onRivalCapReveal={handleRivalCapReveal}
              onStatChange={handleStatChange}
              onPlayerStatChange={handlePlayerStatChange}
              rules={data.rules}
              onRulesChange={(rules) => setData((prev) => ({ ...prev, rules }))}
              legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
              rivalCensorEnabled={data.rivalCensorEnabled ?? true}
              hardcoreModeEnabled={data.hardcoreModeEnabled ?? true}
              onlegendaryIncrement={handleLegendaryIncrement}
              onlegendaryDecrement={handleLegendaryDecrement}
              runStartedAt={data.runStartedAt ?? activeTrackerMeta?.createdAt}
              gameVersion={activeGameVersion}
              rivalPreferences={currentUserRivalPreferences}
              activeTrackerId={activeTrackerId}
              readOnly={isReadOnly}
              generationSpritePath={generationSpritePath}
              pokemonGenerationLimit={pokemonGenerationLimit}
            />
            <FossilTracker
              playerNames={resolvedPlayerNames}
              fossils={data.fossils || resolvedPlayerNames.map(() => [])}
              maxGeneration={pokemonGenerationLimit}
              infiniteFossilsEnabled={data.infiniteFossilsEnabled ?? false}
              onAddFossil={handleAddFossil}
              onToggleBag={handleToggleFossilBag}
              onRevive={handleReviveFossils}
              readOnly={isReadOnly}
              gameVersionId={activeGameVersionId || undefined}
            />
            <Graveyard
              graveyard={data.graveyard}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onManualAddClick={() => setIsModalOpen(true)}
              onEditPair={handleEditGraveyardPair}
              readOnly={isReadOnly}
              generationSpritePath={generationSpritePath}
              pokemonGenerationLimit={pokemonGenerationLimit}
              gameVersionId={activeGameVersionId || undefined}
            />
            <ClearedRoutes routes={clearedRoutes} />
          </div>
        </main>
        <footer className="text-center mt-8 py-4 border-t-2 border-gray-200 dark:border-gray-700">
          <a
            href="https://github.com/joos-too/Pokemon-Soullink-Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title={t("tracker.footer.github")}
          >
            <FaGithub size={18} aria-hidden="true" />
            <span className="text-sm">
              vibecoded by joos-too & FreakMediaLP
            </span>
          </a>
        </footer>
      </div>

      <EditPairModal
        isOpen={addRevivedPokemonOpen}
        onClose={() => {
          setAddRevivedPokemonOpen(false);
          setPendingReviveIndices(null);
        }}
        onSave={(payload) => {
          handleAddBoxPair(payload);
          const names = payload.members.map((m) => m.name);
          confirmRevival(names);
          setAddRevivedPokemonOpen(false);
        }}
        playerLabels={resolvedPlayerNames}
        mode="create"
        initial={{
          route: reviveArea,
          members: resolvedPlayerNames.map(() => ({ name: "", nickname: "" })),
        }}
        generationLimit={pokemonGenerationLimit}
        gameVersionId={activeGameVersionId || undefined}
        generationSpritePath={generationSpritePath}
      />
    </div>
  );

  return (
    <>
      <CreateTrackerModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateTrackerError(null);
        }}
        onSubmit={handleCreateTrackerSubmit}
        isSubmitting={createTrackerLoading}
        error={createTrackerError}
      />
      <DeleteTrackerModal
        isOpen={Boolean(trackerPendingDelete)}
        trackerTitle={trackerPendingDelete?.title}
        onConfirm={handleDeleteTracker}
        onCancel={handleCloseDeleteModal}
        isDeleting={deleteTrackerLoading}
        error={deleteTrackerError}
      />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              trackers={trackerList}
              onOpenTracker={handleOpenTracker}
              onCreateTracker={openCreateTrackerModal}
              onOpenUserSettings={handleOpenUserSettings}
              isLoading={trackerListLoading}
              activeTrackerId={activeTrackerId}
              userEmail={user?.email ?? undefined}
              currentUserId={user?.uid ?? null}
              trackerSummaries={trackerSummaries}
            />
          }
        />
        <Route path="/tracker/:trackerId" element={trackerElement} />
        <Route
          path="/tracker"
          element={
            activeTrackerId ? (
              <Navigate to={`/tracker/${activeTrackerId}`} replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            user ? (
              <UserSettingsPage
                email={user.email}
                onBack={handleNavigateHome}
                onLogout={handleLogout}
                useGenerationSprites={userUseGenerationSprites}
                onGenerationSpritesToggle={handleGenerationSpritesToggle}
                useSpritesInTeamTable={userUseSpritesInTeamTable}
                onSpritesInTeamTableToggle={handleSpritesInTeamTableToggle}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
