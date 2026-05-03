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
  FiSearch,
  FiSliders,
  FiSun,
} from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import type {
  AppState,
  FossilEntry,
  StoneEntry,
  LevelCap,
  Pokemon,
  PokemonLink,
  RivalGender,
  Ruleset,
  TrackerMeta,
  TrackerSummary,
} from "@/types";
import {
  createInitialState,
  ensureStatsForPlayers,
  PLAYER_COLORS,
  sanitizePlayerNames,
  sanitizeRules,
} from "@/src/services/init.ts";
import TeamTable from "@/src/components/widgets/TeamTable.tsx";
import InfoPanel from "@/src/components/widgets/InfoPanel.tsx";
import Graveyard from "@/src/components/widgets/Graveyard.tsx";
import ClearedRoutes from "@/src/components/widgets/ClearedRoutes.tsx";
import AddLostPokemonModal from "@/src/components/modals/AddLostPokemonModal.tsx";
import RulesetSaveModal from "@/src/components/modals/RulesetSaveModal.tsx";
import ItemTracker from "@/src/components/widgets/ItemTracker.tsx";
import { getGenerationSpritePath } from "@/src/services/sprites";
import SelectLossModal from "@/src/components/modals/SelectLossModal.tsx";
import DeleteLinkModal from "@/src/components/modals/DeleteLinkModal.tsx";
import LoginPage from "@/src/components/pages/LoginPage.tsx";
import RegisterPage from "@/src/components/pages/RegisterPage.tsx";
import SettingsPage from "@/src/components/pages/SettingsPage.tsx";
import UserSettingsPage from "@/src/components/pages/UserSettingsPage.tsx";
import PasswordResetPage from "@/src/components/pages/PasswordResetPage.tsx";
import ResetModal from "@/src/components/modals/ResetModal.tsx";
import EditPairModal from "@/src/components/modals/EditPairModal.tsx";
import DarkModeToggle, {
  getDarkMode,
  setDarkMode,
} from "@/src/components/toggles/DarkModeToggle.tsx";
import HomePage from "@/src/components/pages/HomePage.tsx";
import CreateTrackerModal from "@/src/components/modals/CreateTrackerModal.tsx";
import DeleteTrackerModal from "@/src/components/modals/DeleteTrackerModal.tsx";
import TrackerSearchModal from "@/src/components/modals/TrackerSearchModal.tsx";
import { focusRingClasses } from "@/src/styles/focusRing";
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
  getUserWikiPreference,
  removeMemberFromTracker,
  TrackerOperationError,
  updateRivalPreference,
  updateUserGenerationSpritePreference,
  updateUserSpritesInTeamTablePreference,
  updateUserWikiPreference,
} from "@/src/services/trackers";
import { GAME_VERSIONS } from "@/src/data/game-versions";
import {
  DEFAULT_RULES,
  DEFAULT_RULESET_ID,
  DEFAULT_RULESET_ID_EN,
  PRESET_RULESETS,
} from "@/src/data/rulesets";
import {
  deleteRuleset,
  listenToUserRulesets,
  saveRuleset,
  SaveRulesetPayload,
} from "@/src/services/rulesets";
import RulesetEditorPage from "@/src/components/pages/RulesetEditorPage.tsx";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_WIKI_DE,
  DEFAULT_WIKI_EN,
  type WikiId,
} from "@/src/utils/wiki.ts";
import "@/src/pokeapi"; // initialize Pokedex once so sprite caching SW gets registered

const LAST_TRACKER_STORAGE_KEY = "soullink:lastTrackerId";

const MAX_SUPPORTED_GENERATION = 9;
const resolveGenerationFromVersionId = (versionId?: string | null): number => {
  if (!versionId) return MAX_SUPPORTED_GENERATION;
  const match = /^gen(\d+)/i.exec(versionId);
  if (!match) return MAX_SUPPORTED_GENERATION;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return MAX_SUPPORTED_GENERATION;
  return parsed;
};

const normalizeTrackerMeta = (
  trackerId: string,
  meta: TrackerMeta,
): TrackerMeta => ({
  ...meta,
  id: trackerId,
  allPokemonAndItems: meta.allPokemonAndItems === true ? true : undefined,
});

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
  const { t, i18n } = useTranslation();
  const defaultLocaleRulesetId = useMemo(() => {
    const language = (
      i18n.resolvedLanguage ||
      i18n.language ||
      ""
    ).toLowerCase();
    return language.startsWith("en")
      ? DEFAULT_RULESET_ID_EN
      : DEFAULT_RULESET_ID;
  }, [i18n.language, i18n.resolvedLanguage]);
  const [userTrackersLoading, setUserTrackersLoading] = useState(false);
  const [publicTrackerLoading, setPublicTrackerLoading] = useState(() =>
    Boolean(routeTrackerId),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userUseGenerationSprites, setUserUseGenerationSprites] =
    useState(false);
  const [userUseSpritesInTeamTable, setUserUseSpritesInTeamTable] =
    useState(false);
  const [userWikiId, setUserWikiId] = useState<string | null>(null);
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
  const [showDeleteLinkModal, setShowDeleteLinkModal] = useState(false);
  const [pendingDeletePair, setPendingDeletePair] =
    useState<PokemonLink | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
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
  const [rulesets, setRulesets] = useState<Ruleset[]>(PRESET_RULESETS);
  const rulesetUnsubscribeRef = useRef<(() => void) | null>(null);
  const [showRulesetSaveModal, setShowRulesetSaveModal] = useState(false);
  const [pendingRulesetId, setPendingRulesetId] = useState<string | null>(null);
  const [rulesetSaveReason, setRulesetSaveReason] = useState<
    "manual" | "switch"
  >("manual");
  const [rulesetSaveLoading, setRulesetSaveLoading] = useState(false);
  const [rulesetSaveError, setRulesetSaveError] = useState<string | null>(null);
  const [rulesetCopyName, setRulesetCopyName] = useState<string>("");
  const [rulesetOverwriteName, setRulesetOverwriteName] = useState<string>("");

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
  const activeTrackerAllPokemonAndItems =
    activeTrackerMeta?.allPokemonAndItems === true;
  const currentRuleset = useMemo(() => {
    const id = data.rulesetId || defaultLocaleRulesetId;
    return (
      rulesets.find((entry) => entry.id === id) ||
      PRESET_RULESETS.find((entry) => entry.id === id)
    );
  }, [data.rulesetId, defaultLocaleRulesetId, rulesets]);
  const normalizedTrackerRules = useMemo(
    () => sanitizeRules(data.rules),
    [data.rules],
  );
  const savedRulesetRules = useMemo(
    () => sanitizeRules(currentRuleset?.rules),
    [currentRuleset],
  );
  const rulesetInSync = useMemo(
    () =>
      savedRulesetRules.length > 0 &&
      savedRulesetRules.length === normalizedTrackerRules.length &&
      savedRulesetRules.every(
        (rule, index) => rule === normalizedTrackerRules[index],
      ),
    [normalizedTrackerRules, savedRulesetRules],
  );
  const versionGenerationLimit = useMemo(
    () => resolveGenerationFromVersionId(activeGameVersionId),
    [activeGameVersionId],
  );
  const pokemonGenerationLimit = activeTrackerAllPokemonAndItems
    ? MAX_SUPPORTED_GENERATION
    : versionGenerationLimit;
  const itemGenerationLimit = activeTrackerAllPokemonAndItems
    ? MAX_SUPPORTED_GENERATION
    : versionGenerationLimit;
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
  const currentRulesetId = data.rulesetId || defaultLocaleRulesetId;
  const hasUserRulesetWithSameId = useMemo(
    () =>
      rulesets.some(
        (entry) =>
          entry.id === currentRulesetId &&
          !entry.isPreset &&
          entry.createdBy === user?.uid,
      ),
    [currentRulesetId, rulesets, user?.uid],
  );

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

  const handleWikiChange = useCallback(
    async (id: WikiId) => {
      if (!user) return;
      try {
        await updateUserWikiPreference(user.uid, id);
        setUserWikiId(id);
      } catch (error) {
        console.error("Failed to update wiki preference:", error);
      }
    },
    [user],
  );

  const effectiveWikiId: WikiId =
    (userWikiId as WikiId | null) ??
    ((i18n.resolvedLanguage || i18n.language || "")
      .toLowerCase()
      .startsWith("de")
      ? DEFAULT_WIKI_DE
      : DEFAULT_WIKI_EN);

  const coerceAppState = useCallback(
    (incoming: any, base: AppState): AppState => {
      const gameVersionForDefaults =
        activeGameVersion ?? GAME_VERSIONS["gen5_bw"];
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

      const resolvePokemonId = (pokemon: any): number | null => {
        if (Number.isFinite(Number(pokemon?.id)) && Number(pokemon?.id) > 0) {
          return Number(pokemon.id);
        }
        if (typeof pokemon?.pokemonId === "number" && pokemon.pokemonId > 0) {
          return pokemon.pokemonId;
        }
        return null;
      };

      const sanitizePokemon = (pokemon: any): Pokemon => ({
        id: resolvePokemonId(pokemon),
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
            pokemonId:
              Number.isFinite(Number(f.pokemonId)) && Number(f.pokemonId) > 0
                ? Number(f.pokemonId)
                : null,
          }));
        });
      };

      const sanitizeStones = (playerStones: any): StoneEntry[][] => {
        return normalizedNames.map((_, i) => {
          const list = Array.isArray(playerStones) ? playerStones[i] : null;
          if (!Array.isArray(list)) return [];
          return list.map((s: any) => ({
            stoneId: s.stoneId || "",
            location: s.location || "",
            inBag: !!s.inBag,
            used: !!s.used,
          }));
        });
      };

      const resolvedRulesetId =
        typeof safe.rulesetId === "string" && safe.rulesetId.trim().length > 0
          ? safe.rulesetId
          : base.rulesetId || DEFAULT_RULESET_ID;
      const sanitizedRules = sanitizeRules(safe.rules);

      const stats = ensureStatsForPlayers(safe.stats, playerCount);

      return {
        playerNames: normalizedNames,
        team: sanitizeArray(safe.team),
        box: sanitizeArray(safe.box),
        graveyard: sanitizeArray(safe.graveyard),
        rules:
          sanitizedRules.length > 0
            ? sanitizedRules
            : base.rules && base.rules.length > 0
              ? base.rules
              : DEFAULT_RULES,
        rulesetId: resolvedRulesetId,
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
        megaStoneSpriteStyle:
          safe.megaStoneSpriteStyle ?? base.megaStoneSpriteStyle ?? "item",
        fossils: sanitizeFossils(safe.fossils),
        stones: sanitizeStones(safe.stones),
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

  useEffect(() => {
    if (rulesetUnsubscribeRef.current) {
      rulesetUnsubscribeRef.current();
      rulesetUnsubscribeRef.current = null;
    }
    setRulesets(PRESET_RULESETS);
    if (!user) return;

    const unsubscribe = listenToUserRulesets(user.uid, (customRulesets) => {
      const sortedCustom = [...customRulesets].sort(
        (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
      );
      setRulesets([...sortedCustom, ...PRESET_RULESETS]);
    });
    rulesetUnsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      rulesetUnsubscribeRef.current = null;
    };
  }, [user]);

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
      getUserWikiPreference(user.uid),
    ])
      .then(([genSprites, teamTableSprites, wikiId]) => {
        setUserUseGenerationSprites(genSprites);
        setUserUseSpritesInTeamTable(teamTableSprites);
        setUserWikiId(wikiId);
      })
      .catch(() => {
        setUserUseGenerationSprites(false);
        setUserUseSpritesInTeamTable(false);
        setUserWikiId(null);
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
              next[trackerId] = normalizeTrackerMeta(trackerId, meta);
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
            [routeTrackerId]: normalizeTrackerMeta(routeTrackerId, meta),
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

      // Preserve revealed status of rival caps across resets
      const rivalCapsWithRevealedState = base.rivalCaps.map((rc) => {
        const prevRc = prev.rivalCaps?.find((p) => p.id === rc.id);
        return {
          ...rc,
          revealed: prevRc?.revealed ?? false,
        };
      });

      return {
        ...base,
        rivalCaps: rivalCapsWithRevealedState,
        rules: prev.rules, // keep rule changes
        rulesetId: prev.rulesetId ?? base.rulesetId,
        // keep toggled settings
        legendaryTrackerEnabled: prev.legendaryTrackerEnabled,
        rivalCensorEnabled: prev.rivalCensorEnabled,
        hardcoreModeEnabled: prev.hardcoreModeEnabled,
        infiniteFossilsEnabled: prev.infiniteFossilsEnabled,
        megaStoneSpriteStyle: prev.megaStoneSpriteStyle,
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

  const getRulesetCopyName = useCallback(() => {
    const rulesetName = currentRuleset?.name;
    let title: string;
    if (rulesetName) {
      title = t("settings.rulesets.copyNameTemplate", {
        rulesetName: rulesetName,
      });
    } else {
      title = t("settings.rulesets.defaultRulesetName");
    }

    return title;
  }, [currentRuleset?.name, t]);

  const getRulesetOverwriteName = useCallback(() => {
    const rulesetName = currentRuleset?.name;
    const trackerName = activeTrackerMeta?.title;
    let title: string;

    if (rulesetName) {
      title = rulesetName;
    } else if (trackerName) {
      title = t("settings.rulesets.trackerRuleTemplate", {
        trackerName: trackerName,
      });
    } else {
      title = t("settings.rulesets.defaultRulesetName");
    }
    return title;
  }, [activeTrackerMeta?.title, currentRuleset?.name, t]);

  useEffect(() => {
    setRulesetCopyName(getRulesetCopyName());
    setRulesetOverwriteName(getRulesetOverwriteName());
  }, [getRulesetCopyName, getRulesetOverwriteName]);

  const handleOpenRulesetEditor = useCallback(() => {
    setMobileMenuOpen(false);
    const from =
      typeof window !== "undefined"
        ? `${location.pathname}${location.search}`
        : undefined;
    navigate("/rulesets", { state: { from } });
  }, [navigate, location.pathname, location.search]);

  const rulesetBackTarget =
    (location.state as { from?: string } | null)?.from || null;

  const handleRulesetBack = useCallback(() => {
    if (rulesetBackTarget) {
      navigate(rulesetBackTarget);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }, [navigate, rulesetBackTarget]);

  const handleSaveRuleset = useCallback(
    async (payload: SaveRulesetPayload): Promise<Ruleset> => {
      if (!user) throw new Error("Du musst angemeldet sein.");
      return saveRuleset(user.uid, payload);
    },
    [user],
  );

  const handleDeleteRuleset = useCallback(
    async (rulesetId: string) => {
      if (!user) throw new Error("Du musst angemeldet sein.");
      await deleteRuleset(user.uid, rulesetId);
    },
    [user],
  );

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
      value: string | number | null,
    ) => {
      if (isReadOnly) return;
      setData((prev) => {
        const list = [...prev[key]];
        const target = list[index];
        if (!target) return prev;
        const members = [...target.members];
        members[playerIndex] = {
          ...(members[playerIndex] ?? { id: null, nickname: "" }),
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
      value: string | number | null,
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
      value: string | number | null,
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

  const handleDeleteLink = useCallback(
    (pair: PokemonLink) => {
      if (isReadOnly) return;
      setPendingDeletePair(pair);
      setShowDeleteLinkModal(true);
    },
    [isReadOnly],
  );

  const handleConfirmDeleteLink = useCallback(() => {
    if (isReadOnly || !pendingDeletePair) return;
    setData((prev) => ({
      ...prev,
      team: prev.team.filter((p) => p.id !== pendingDeletePair.id),
      box: prev.box.filter((p) => p.id !== pendingDeletePair.id),
      graveyard: prev.graveyard.filter((p) => p.id !== pendingDeletePair.id),
    }));
    setShowDeleteLinkModal(false);
    setPendingDeletePair(null);
  }, [isReadOnly, pendingDeletePair]);

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
        id: member.id,
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
          id: member.id,
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
              id: member.id,
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
            id: member.id,
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

  const handleMegaStoneSpriteStyleToggle = (usePokemon: boolean) => {
    if (isReadOnly) return;
    setData((prev) => ({
      ...prev,
      megaStoneSpriteStyle: usePokemon ? "pokemon" : "item",
    }));
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

  const confirmRevival = (revivedIds: (number | null)[]) => {
    if (!pendingReviveIndices) return;

    setData((prev) => {
      const newFossils = [...(prev.fossils || [])];
      pendingReviveIndices.forEach((fIdx, pIdx) => {
        if (newFossils[pIdx] && newFossils[pIdx][fIdx]) {
          newFossils[pIdx] = newFossils[pIdx].map((f, i) =>
            i === fIdx
              ? { ...f, revived: true, pokemonId: revivedIds[pIdx] ?? null }
              : f,
          );
        }
      });
      return { ...prev, fossils: newFossils };
    });

    setPendingReviveIndices(null);
  };

  const handleUpdateFossilList = useCallback(
    (newFossils: FossilEntry[][]) => {
      if (isReadOnly) return;
      setData((prev) => ({
        ...prev,
        fossils: newFossils,
      }));
    },
    [isReadOnly],
  );

  const handleAddStone = (
    pIdx: number,
    stoneId: string,
    location: string,
    inBag: boolean,
  ) => {
    if (isReadOnly) return;
    setData((prev) => {
      const newStones = [...(prev.stones || prev.playerNames.map(() => []))];
      const playerList = Array.isArray(newStones[pIdx])
        ? [...newStones[pIdx]]
        : [];
      newStones[pIdx] = [
        ...playerList,
        { stoneId, location, inBag, used: false },
      ];
      return { ...prev, stones: newStones };
    });
  };

  const handleToggleStoneBag = (pIdx: number, sIdx: number) => {
    if (isReadOnly) return;
    setData((prev) => {
      const newStones = [...(prev.stones || [])];
      if (!newStones[pIdx]) return prev;
      newStones[pIdx] = newStones[pIdx].map((s, i) =>
        i === sIdx ? { ...s, inBag: true, location: "" } : s,
      );
      return { ...prev, stones: newStones };
    });
  };

  const handleUseStone = (pIdx: number, sIdx: number) => {
    if (isReadOnly || !data.stones) return;
    setData((prev) => {
      const newStones = [...(prev.stones || [])];
      if (newStones[pIdx] && newStones[pIdx][sIdx]) {
        newStones[pIdx] = newStones[pIdx].map((s, i) =>
          i === sIdx ? { ...s, used: true } : s,
        );
      }
      return { ...prev, stones: newStones };
    });
  };

  const handleUpdateStoneList = useCallback(
    (newStones: StoneEntry[][]) => {
      if (isReadOnly) return;
      setData((prev) => ({
        ...prev,
        stones: newStones,
      }));
    },
    [isReadOnly],
  );

  const applyRulesetChange = useCallback(
    (rulesetId: string) => {
      if (isReadOnly) return;
      const selected =
        rulesets.find((entry) => entry.id === rulesetId) ??
        PRESET_RULESETS.find((entry) => entry.id === rulesetId);
      const normalizedRules =
        sanitizeRules(selected?.rules) || sanitizeRules(DEFAULT_RULES);
      const finalRules =
        normalizedRules.length > 0 ? normalizedRules : DEFAULT_RULES;
      const resolvedId = selected?.id ?? DEFAULT_RULESET_ID;
      setData((prev) => ({
        ...prev,
        rules: finalRules,
        rulesetId: resolvedId,
      }));
      if (activeTrackerId) {
        setTrackerMetas((prev) => {
          const existing = prev[activeTrackerId];
          if (!existing) return prev;
          return {
            ...prev,
            [activeTrackerId]: {
              ...existing,
              rulesetId: resolvedId,
            },
          };
        });
        update(ref(db, `trackers/${activeTrackerId}/meta`), {
          rulesetId: resolvedId,
        });
      }
    },
    [activeTrackerId, isReadOnly, rulesets],
  );

  const openRulesetSaveModal = useCallback(
    (reason: "manual" | "switch", nextRulesetId?: string | null) => {
      setRulesetSaveReason(reason);
      setPendingRulesetId(nextRulesetId ?? null);
      setRulesetSaveError(null);
      setRulesetCopyName(getRulesetCopyName());
      setRulesetOverwriteName(getRulesetOverwriteName());
      setShowRulesetSaveModal(true);
    },
    [getRulesetCopyName, getRulesetOverwriteName],
  );

  const handleRulesetChange = useCallback(
    (rulesetId: string) => {
      if (isReadOnly) return;
      const currentId = data.rulesetId || DEFAULT_RULESET_ID;
      if (rulesetId === currentId) return;
      if (!rulesetInSync) {
        openRulesetSaveModal("switch", rulesetId);
        return;
      }
      applyRulesetChange(rulesetId);
    },
    [
      applyRulesetChange,
      data.rulesetId,
      isReadOnly,
      openRulesetSaveModal,
      rulesetInSync,
    ],
  );

  const handleSynchronizeRules = useCallback(() => {
    if (isReadOnly) return;
    applyRulesetChange(currentRulesetId);
  }, [applyRulesetChange, currentRulesetId, isReadOnly]);

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

  const closeRulesetSaveModal = () => {
    setShowRulesetSaveModal(false);
    setRulesetSaveError(null);
    setPendingRulesetId(null);
    setRulesetSaveLoading(false);
  };

  const handleSaveRulesetFromTracker = useCallback(
    async (mode: "overwrite" | "copy") => {
      if (!user) {
        setRulesetSaveError("Du musst angemeldet sein.");
        return;
      }
      const baseRulesetIsPreset = Boolean(currentRuleset?.isPreset);
      const effectiveMode =
        baseRulesetIsPreset && mode === "overwrite" ? "copy" : mode;
      const currentId = data.rulesetId || defaultLocaleRulesetId;
      const baseRuleset =
        rulesets.find((entry) => entry.id === currentId) ||
        PRESET_RULESETS.find((entry) => entry.id === currentId);
      const name =
        effectiveMode === "overwrite"
          ? rulesetOverwriteName || getRulesetOverwriteName()
          : rulesetCopyName || getRulesetCopyName();
      const description = baseRuleset?.description || "";
      const tags = baseRuleset?.tags;
      const rulesToPersist =
        normalizedTrackerRules.length > 0
          ? normalizedTrackerRules
          : (baseRuleset?.rules ?? DEFAULT_RULES);

      setRulesetSaveLoading(true);
      setRulesetSaveError(null);
      try {
        await saveRuleset(user.uid, {
          id:
            effectiveMode === "overwrite" && !baseRulesetIsPreset
              ? currentId
              : undefined,
          name,
          description,
          rules: rulesToPersist,
          tags,
        });
        if (rulesetSaveReason === "switch" && pendingRulesetId) {
          applyRulesetChange(pendingRulesetId);
        }
        setPendingRulesetId(null);
        setShowRulesetSaveModal(false);
      } catch (err) {
        const fallback =
          t("settings.rulesets.saveModal.error", {
            defaultValue: "Speichern fehlgeschlagen.",
          }) || "Fehler";
        setRulesetSaveError(
          err instanceof Error ? err.message : String(fallback),
        );
      } finally {
        setRulesetSaveLoading(false);
      }
    },
    [
      activeTrackerMeta?.title,
      applyRulesetChange,
      data.rulesetId,
      defaultLocaleRulesetId,
      normalizedTrackerRules,
      pendingRulesetId,
      rulesetCopyName,
      rulesetOverwriteName,
      rulesets,
      rulesetSaveReason,
      t,
      user,
      getRulesetCopyName,
      getRulesetOverwriteName,
    ],
  );

  const handleSkipRulesetSave = () => {
    if (rulesetSaveReason === "switch" && pendingRulesetId) {
      applyRulesetChange(pendingRulesetId);
    }
    closeRulesetSaveModal();
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
    allPokemonAndItems?: boolean;
    rulesetId?: string;
  }) => {
    if (!user) return;
    setCreateTrackerError(null);
    setCreateTrackerLoading(true);
    try {
      const selectedRuleset =
        rulesets.find((entry) => entry.id === payload.rulesetId) ??
        PRESET_RULESETS.find((entry) => entry.id === payload.rulesetId);
      const fallbackRuleset =
        PRESET_RULESETS.find((entry) => entry.id === defaultLocaleRulesetId) ||
        PRESET_RULESETS.find((entry) => entry.id === DEFAULT_RULESET_ID);
      const resolvedRuleset = selectedRuleset ?? fallbackRuleset;
      const rulesetId =
        resolvedRuleset?.id ?? fallbackRuleset?.id ?? defaultLocaleRulesetId;
      const initialRules = sanitizeRules(
        resolvedRuleset?.rules ?? fallbackRuleset?.rules ?? DEFAULT_RULES,
      );
      await createTracker({
        title: payload.title,
        playerNames: payload.playerNames,
        memberInvites: payload.memberInvites,
        owner: user,
        gameVersionId: payload.gameVersionId,
        allPokemonAndItems: payload.allPokemonAndItems,
        rulesetId,
        rules:
          initialRules.length > 0
            ? initialRules
            : (fallbackRuleset?.rules ?? DEFAULT_RULES),
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
      rulesets={rulesets}
      selectedRulesetId={data.rulesetId}
      onRulesetSelect={handleRulesetChange}
      onSynchronizeRules={handleSynchronizeRules}
      onOpenRulesetEditor={handleOpenRulesetEditor}
      isGuest={isGuest}
      onSaveRulesetToCollection={() => openRulesetSaveModal("manual")}
      rulesetDirty={!rulesetInSync}
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
      <DeleteLinkModal
        isOpen={!isReadOnly && showDeleteLinkModal}
        onClose={() => {
          setShowDeleteLinkModal(false);
          setPendingDeletePair(null);
        }}
        onConfirm={handleConfirmDeleteLink}
        pair={pendingDeletePair}
        playerNames={resolvedPlayerNames}
      />
      <ResetModal
        isOpen={!isReadOnly && showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
      />
      <TrackerSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        playerNames={resolvedPlayerNames}
        playerColors={playerColors}
        team={data.team}
        box={data.box}
        graveyard={data.graveyard}
        routes={clearedRoutes}
        fossils={data.fossils ?? []}
        stones={data.stones ?? []}
        generationSpritePath={generationSpritePath}
      />
      {readOnlyNotice && (
        <div className="max-w-480 mx-auto mt-3 mb-3 bg-blue-50 border border-blue-200 text-blue-800 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-100 rounded-md px-3 py-2 text-sm shadow-sm">
          {readOnlyNotice}
        </div>
      )}
      <div className="max-w-480 mx-auto bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg">
        <header className="relative py-4 border-b-2 border-gray-300 dark:border-gray-700">
          <div className="mx-auto max-w-full px-2 pr-14 sm:pr-16 xl:px-0 xl:pr-0 text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-bold font-press-start tracking-tighter dark:text-gray-100">
              {trackerTitleDisplay}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("tracker.header.subtitle")}
            </p>
          </div>
          <div className="absolute right-2 sm:right-4 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
            {/* Desktop icons (>=xl) */}
            <div className="hidden xl:flex items-center gap-1 sm:gap-2">
              <DarkModeToggle />
              <button
                onClick={() => setShowSearchModal(true)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${focusRingClasses}`}
                aria-label={t("tracker.search.open")}
                title={t("tracker.search.open")}
              >
                <FiSearch size={28} />
              </button>
              <button
                onClick={handleNavigateHome}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${focusRingClasses}`}
                aria-label={t("common.overview")}
                title={t("common.overview")}
              >
                <FiHome size={28} />
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleReset}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${focusRingClasses}`}
                  aria-label={t("tracker.actions.resetRun")}
                  title={t("tracker.actions.resetRun")}
                >
                  <FiRotateCw size={28} />
                </button>
              )}
              {(!isReadOnly || isGuest) && (
                <button
                  onClick={openSettingsPanel}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${focusRingClasses}`}
                  aria-label={t("tracker.actions.settings")}
                  title={t("tracker.actions.settings")}
                >
                  <FiSliders size={28} />
                </button>
              )}
            </div>
            {/* Mobile burger (<xl) */}
            <button
              className={`xl:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${focusRingClasses}`}
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
                className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${focusRingClasses}`}
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
                className={`w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2 ${focusRingClasses}`}
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
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSearchModal(true);
                }}
                className={`w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2 ${focusRingClasses}`}
                title={t("tracker.search.open")}
              >
                <FiSearch size={18} /> {t("tracker.search.open")}
              </button>
              <button
                onClick={handleNavigateHome}
                className={`w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2 ${focusRingClasses}`}
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
                  className={`w-full text-left px-2 py-2 rounded-md text-sm inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
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
                  className={`w-full text-left px-2 py-2 rounded-md text-sm inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                  title={t("tracker.menu.settings")}
                >
                  <FiSliders size={18} /> {t("tracker.menu.settings")}
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
              wikiId={effectiveWikiId}
            />
            <TeamTable
              title={t("team.boxTitle")}
              data={data.box}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onPokemonChange={handleBoxChange}
              onRouteChange={handleBoxRouteChange}
              onAddToGraveyard={handleAddToGraveyard}
              onDeleteLink={handleDeleteLink}
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
              wikiId={effectiveWikiId}
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
            <ItemTracker
              playerNames={resolvedPlayerNames}
              fossils={data.fossils || resolvedPlayerNames.map(() => [])}
              stones={data.stones || resolvedPlayerNames.map(() => [])}
              maxGeneration={itemGenerationLimit}
              infiniteFossilsEnabled={data.infiniteFossilsEnabled ?? false}
              onAddFossil={handleAddFossil}
              onToggleBag={handleToggleFossilBag}
              onRevive={handleReviveFossils}
              onUpdateFossils={handleUpdateFossilList}
              onAddStone={handleAddStone}
              onToggleStoneBag={handleToggleStoneBag}
              onUseStone={handleUseStone}
              onUpdateStones={handleUpdateStoneList}
              readOnly={isReadOnly}
              gameVersionId={activeGameVersionId || undefined}
              allPokemonAndItems={activeTrackerAllPokemonAndItems}
              generationSpritePath={generationSpritePath}
              megaStoneSpriteStyle={data.megaStoneSpriteStyle ?? "item"}
              onMegaStoneSpriteStyleToggle={handleMegaStoneSpriteStyleToggle}
            />
            <Graveyard
              graveyard={data.graveyard}
              playerNames={resolvedPlayerNames}
              playerColors={playerColors}
              onManualAddClick={() => setIsModalOpen(true)}
              onEditPair={handleEditGraveyardPair}
              onDeleteLink={handleDeleteLink}
              readOnly={isReadOnly}
              generationSpritePath={generationSpritePath}
              pokemonGenerationLimit={pokemonGenerationLimit}
              gameVersionId={activeGameVersionId || undefined}
              wikiId={effectiveWikiId}
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
          const pokemonIds = payload.members.map((m) => m.id);
          confirmRevival(pokemonIds);
          setAddRevivedPokemonOpen(false);
        }}
        playerLabels={resolvedPlayerNames}
        mode="create"
        initial={{
          route: reviveArea,
          members: resolvedPlayerNames.map(() => ({ id: null, nickname: "" })),
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
        rulesets={rulesets}
        defaultRulesetId={defaultLocaleRulesetId}
      />
      <DeleteTrackerModal
        isOpen={Boolean(trackerPendingDelete)}
        trackerTitle={trackerPendingDelete?.title}
        onConfirm={handleDeleteTracker}
        onCancel={handleCloseDeleteModal}
        isDeleting={deleteTrackerLoading}
        error={deleteTrackerError}
      />
      {showRulesetSaveModal && (
        <RulesetSaveModal
          isOpen={showRulesetSaveModal}
          onClose={closeRulesetSaveModal}
          onSkip={handleSkipRulesetSave}
          onSave={handleSaveRulesetFromTracker}
          isLoading={rulesetSaveLoading}
          error={rulesetSaveError}
          reason={rulesetSaveReason}
          currentRuleset={currentRuleset}
          hasUserRulesetWithSameId={hasUserRulesetWithSameId}
          rulesetCopyName={rulesetCopyName}
          rulesetOverwriteName={rulesetOverwriteName}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              trackers={trackerList}
              onOpenTracker={handleOpenTracker}
              onCreateTracker={openCreateTrackerModal}
              onOpenUserSettings={handleOpenUserSettings}
              onOpenRulesetEditor={handleOpenRulesetEditor}
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
          path="/rulesets"
          element={
            user ? (
              <RulesetEditorPage
                rulesets={rulesets}
                onBack={handleRulesetBack}
                onSave={handleSaveRuleset}
                onDelete={handleDeleteRuleset}
                defaultRulesetId={DEFAULT_RULESET_ID}
              />
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
                wikiId={userWikiId ?? effectiveWikiId}
                onWikiChange={handleWikiChange}
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
