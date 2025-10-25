import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {FiSettings, FiRotateCw, FiMenu, FiSun, FiMoon, FiHome} from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import type {AppState, PokemonPair, RivalCap, TrackerMeta, TrackerSummary, LevelCap} from '@/types';
import {createInitialState, PLAYER1_COLOR, PLAYER2_COLOR, DEFAULT_RULES, DEFAULT_RIVAL_CAPS} from '@/constants';
import TeamTable from '@/src/components/TeamTable';
import InfoPanel from '@/src/components/InfoPanel';
import Graveyard from '@/src/components/Graveyard';
import ClearedRoutes from '@/src/components/ClearedRoutes';
import AddLostPokemonModal from '@/src/components/AddLostPokemonModal';
import SelectLossModal from '@/src/components/SelectLossModal';
import LoginPage from '@/src/components/LoginPage';
import RegisterPage from '@/src/components/RegisterPage';
import SettingsPage from '@/src/components/SettingsPage';
import ResetModal from '@/src/components/ResetModal';
import DarkModeToggle, { getDarkMode, setDarkMode } from '@/src/components/DarkModeToggle';
import HomePage from '@/src/components/HomePage';
import CreateTrackerModal from '@/src/components/CreateTrackerModal';
import DeleteTrackerModal from '@/src/components/DeleteTrackerModal';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {db, auth} from '@/src/firebaseConfig';
import {ref, onValue, set, get, update} from "firebase/database";
import {onAuthStateChanged, User, signOut} from "firebase/auth";
import { initPokemonGermanNamesBackgroundRefresh } from '@/src/services/pokemonSearch';
import {addMemberByEmail, createTracker, deleteTracker, ensureUserProfile, TrackerOperationError} from '@/src/services/trackers';

const LAST_TRACKER_STORAGE_KEY = 'soullink:lastTrackerId';

const computeTrackerSummary = (state?: Partial<AppState> | null): TrackerSummary => {
    const teamCount = Array.isArray(state?.team) ? state.team.length : 0;
    const boxCount = Array.isArray(state?.box) ? state.box.length : 0;
    const graveyardCount = Array.isArray(state?.graveyard) ? state.graveyard.length : 0;
    const runs = Number(state?.stats?.runs ?? 0) || 0;
    const levelCaps = Array.isArray(state?.levelCaps) ? (state.levelCaps as LevelCap[]) : [];
    const championCap = levelCaps.find((cap) => cap?.arena?.toLowerCase().includes('champ')) ?? levelCaps[levelCaps.length - 1];
    const championDone = Boolean(championCap?.done);
    let bestLabel = 'Noch keine Arena';
    const doneCaps = levelCaps.filter((cap) => cap?.done);
    if (doneCaps.length > 0) {
        bestLabel = doneCaps[doneCaps.length - 1]?.arena || bestLabel;
    }
    const deathCount = Number(state?.stats?.deaths?.player1 ?? 0) + Number(state?.stats?.deaths?.player2 ?? 0);
    return {
        teamCount,
        boxCount,
        graveyardCount,
        deathCount,
        runs,
        championDone,
        progressLabel: championDone ? 'Run geschafft' : bestLabel,
    };
};

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState<AppState>(createInitialState());
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const storedTrackerId = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_TRACKER_STORAGE_KEY) : null;
    const [activeTrackerId, setActiveTrackerId] = useState<string | null>(storedTrackerId);
    const [userTrackerIds, setUserTrackerIds] = useState<string[]>([]);
    const [trackerMetas, setTrackerMetas] = useState<Record<string, TrackerMeta>>({});
    const metaListenersRef = useRef<Map<string, () => void>>(new Map());
    const trackerStateListenersRef = useRef<Map<string, () => void>>(new Map());
    const [trackerSummaries, setTrackerSummaries] = useState<Record<string, TrackerSummary>>({});
    const [userTrackersLoading, setUserTrackersLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const skipNextWriteRef = useRef(false);
    const [showLossModal, setShowLossModal] = useState(false);
    const [pendingLossPair, setPendingLossPair] = useState<PokemonPair | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(getDarkMode());
    const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createTrackerError, setCreateTrackerError] = useState<string | null>(null);
    const [createTrackerLoading, setCreateTrackerLoading] = useState(false);
    const [trackerPendingDelete, setTrackerPendingDelete] = useState<TrackerMeta | null>(null);
    const [deleteTrackerLoading, setDeleteTrackerLoading] = useState(false);
    const [deleteTrackerError, setDeleteTrackerError] = useState<string | null>(null);

    // Ensure incoming Firebase data matches our expected shape
    const coerceAppState = useCallback((incoming: any, base: AppState): AppState => {
        const sanitizePair = (p: any): PokemonPair => ({
            id: Number(p?.id) || 0,
            route: typeof p?.route === 'string' ? p.route : '',
            player1: {
                name: typeof p?.player1?.name === 'string' ? p.player1.name : '',
                nickname: typeof p?.player1?.nickname === 'string' ? p.player1.nickname : '',
            },
            player2: {
                name: typeof p?.player2?.name === 'string' ? p.player2.name : '',
                nickname: typeof p?.player2?.nickname === 'string' ? p.player2.nickname : '',
            },
        });
        const sanitizeArray = (arr: any, fallback: PokemonPair[]) => {
            const list = Array.isArray(arr) ? arr : fallback;
            return list.map((p) => sanitizePair(p));
        };
        const sanitizeRivalCap = (rc: any, i: number): RivalCap => ({
            id: Number(rc?.id ?? base.rivalCaps[i]?.id ?? i + 1),
            location: typeof rc?.location === 'string' ? rc.location : (base.rivalCaps[i]?.location ?? ''),
            rival: typeof rc?.rival === 'string' ? rc.rival : (base.rivalCaps[i]?.rival ?? ''),
            level: typeof rc?.level === 'string' ? rc.level : (base.rivalCaps[i]?.level ?? ''),
            done: Boolean(rc?.done),
            revealed: Boolean(rc?.revealed),
        });

        const safe = (incoming && typeof incoming === 'object') ? incoming : {};
        return {
            player1Name: safe.player1Name ?? base.player1Name,
            player2Name: safe.player2Name ?? base.player2Name,
            team: sanitizeArray(safe.team, base.team),
            box: sanitizeArray(safe.box, base.box),
            graveyard: sanitizeArray(safe.graveyard, base.graveyard),
            rules: Array.isArray(safe.rules) ? safe.rules.map((r: any) => (typeof r === 'string' ? r : '')).filter((r: string) => r.trim().length > 0) : base.rules ?? DEFAULT_RULES,
            levelCaps: Array.isArray(safe.levelCaps)
                ? safe.levelCaps.map((cap: any, i: number) => ({
                    id: Number(cap?.id ?? base.levelCaps[i]?.id ?? i + 1),
                    arena: typeof cap?.arena === 'string' ? cap.arena : (base.levelCaps[i]?.arena ?? ''),
                    level: typeof cap?.level === 'string' ? cap.level : (base.levelCaps[i]?.level ?? ''),
                    done: Boolean(cap?.done),
                }))
                : base.levelCaps,
            rivalCaps: Array.isArray(safe.rivalCaps)
                ? safe.rivalCaps.map((rc, i) => sanitizeRivalCap(rc, i))
                : base.rivalCaps ?? DEFAULT_RIVAL_CAPS,
            stats: {
                runs: safe.stats?.runs ?? base.stats.runs,
                best: safe.stats?.best ?? base.stats.best,
                top4Items: {
                    player1: safe.stats?.top4Items?.player1 ?? base.stats.top4Items.player1,
                    player2: safe.stats?.top4Items?.player2 ?? base.stats.top4Items.player2,
                },
                deaths: {
                    player1: safe.stats?.deaths?.player1 ?? base.stats.deaths.player1,
                    player2: safe.stats?.deaths?.player2 ?? base.stats.deaths.player2,
                },
                sumDeaths: {
                    player1: safe.stats?.sumDeaths?.player1 ?? base.stats.sumDeaths?.player1 ?? 0,
                    player2: safe.stats?.sumDeaths?.player2 ?? base.stats.sumDeaths?.player2 ?? 0,
                },
                legendaryEncounters: safe.stats?.legendaryEncounters ?? base.stats.legendaryEncounters ?? 0,
            },
            legendaryTrackerEnabled: safe.legendaryTrackerEnabled ?? base.legendaryTrackerEnabled ?? true,
            rivalCensorEnabled: safe.rivalCensorEnabled ?? base.rivalCensorEnabled ?? true,
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setAuthScreen('login');
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        ensureUserProfile(user).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (location.pathname !== '/tracker' && showSettings) {
            setShowSettings(false);
        }
    }, [location.pathname, showSettings]);

    useEffect(() => {
        if (!user) {
            setUserTrackerIds([]);
            setTrackerMetas({});
            metaListenersRef.current.forEach(unsub => unsub());
            metaListenersRef.current.clear();
            setActiveTrackerId(null);
            setUserTrackersLoading(false);
            return;
        }

        setUserTrackersLoading(true);
        const userTrackersRef = ref(db, `userTrackers/${user.uid}`);
        const unsubscribe = onValue(userTrackersRef, (snapshot) => {
            const ids = snapshot.exists() ? Object.keys(snapshot.val()) : [];
            setUserTrackerIds(ids);
            setUserTrackersLoading(false);
        }, () => setUserTrackersLoading(false));

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
                setTrackerMetas(prev => {
                    const next = { ...prev };
                    delete next[trackerId];
                    return next;
                });
            }
        }

        userTrackerIds.forEach((trackerId) => {
            if (listeners.has(trackerId)) return;
            const metaRef = ref(db, `trackers/${trackerId}/meta`);
            const unsubscribe = onValue(metaRef, (snapshot) => {
                const meta = snapshot.val();
                setTrackerMetas(prev => {
                    const next = { ...prev };
                    if (meta) {
                        next[trackerId] = { ...meta, id: trackerId };
                    } else {
                        delete next[trackerId];
                    }
                    return next;
                });
            }, () => {
                setTrackerMetas(prev => {
                    const next = { ...prev };
                    delete next[trackerId];
                    return next;
                });
            });
            listeners.set(trackerId, unsubscribe);
        });

        return () => {
            if (!user) {
                listeners.forEach(unsub => unsub());
                listeners.clear();
            }
        };
    }, [userTrackerIds, user]);

    useEffect(() => {
        if (!user) {
            trackerStateListenersRef.current.forEach(unsub => unsub());
            trackerStateListenersRef.current.clear();
            setTrackerSummaries({});
            return;
        }

        const listeners = trackerStateListenersRef.current;
        for (const [trackerId, unsubscribe] of listeners.entries()) {
            if (!userTrackerIds.includes(trackerId)) {
                unsubscribe();
                listeners.delete(trackerId);
                setTrackerSummaries(prev => {
                    const next = { ...prev };
                    delete next[trackerId];
                    return next;
                });
            }
        }

        userTrackerIds.forEach((trackerId) => {
            if (listeners.has(trackerId)) return;
            const stateRef = ref(db, `trackers/${trackerId}/state`);
            const unsubscribe = onValue(stateRef, (snapshot) => {
                const stateValue = snapshot.val();
                setTrackerSummaries(prev => ({
                    ...prev,
                    [trackerId]: computeTrackerSummary(stateValue),
                }));
            }, () => {
                setTrackerSummaries(prev => {
                    const next = { ...prev };
                    delete next[trackerId];
                    return next;
                });
            });
            listeners.set(trackerId, unsubscribe);
        });

        return () => {
            if (!user) {
                listeners.forEach(unsub => unsub());
                listeners.clear();
            }
        };
    }, [user, userTrackerIds]);

    useEffect(() => {
        if (!user) {
            setActiveTrackerId(null);
            return;
        }
        if (userTrackersLoading) return;
        if (activeTrackerId && !userTrackerIds.includes(activeTrackerId)) {
            setActiveTrackerId(null);
            return;
        }
        if (!activeTrackerId) {
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_TRACKER_STORAGE_KEY) : null;
            if (stored && userTrackerIds.includes(stored)) {
                setActiveTrackerId(stored);
            }
        }
    }, [userTrackerIds, activeTrackerId, user, userTrackersLoading]);

    useEffect(() => {
        if (!user) return;
        if (activeTrackerId) {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(LAST_TRACKER_STORAGE_KEY, activeTrackerId);
            }
        } else if (typeof window !== 'undefined') {
            window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
        }
    }, [activeTrackerId, user]);

    // Preload/refresh German Pokémon names in the background (non-blocking)
    useEffect(() => {
        initPokemonGermanNamesBackgroundRefresh();
    }, []);

    // Keep local isDark in sync with document class/localStorage
    useEffect(() => {
        const target = document.documentElement;
        const observer = new MutationObserver(() => setIsDark(getDarkMode()));
        observer.observe(target, { attributes: true, attributeFilter: ['class'] });
        const onStorage = (e: StorageEvent) => { if (e.key === 'color-theme') setIsDark(getDarkMode()); };
        window.addEventListener('storage', onStorage);
        return () => { observer.disconnect(); window.removeEventListener('storage', onStorage); };
    }, []);

    useEffect(() => {
        if (!user) {
            setData(createInitialState());
            setDataLoaded(false);
            return;
        }

        if (!activeTrackerId) {
            setData(createInitialState());
            setDataLoaded(true);
            return;
        }

        const dbRef = ref(db, `trackers/${activeTrackerId}/state`);
        let unsub: (() => void) | undefined;
        let cancelled = false;

        (async () => {
            try {
                const snapshot = await get(dbRef);
                const dbData = snapshot.val();
                if (dbData) {
                    skipNextWriteRef.current = true;
                    setData(prev => coerceAppState(dbData, prev));
                } else {
                    setData(createInitialState());
                }
            } catch (e) {
                setData(createInitialState());
            } finally {
                if (cancelled) return;
                setDataLoaded(true);
                unsub = onValue(dbRef, (snap) => {
                    const liveData = snap.val();
                    if (liveData) {
                        skipNextWriteRef.current = true;
                        setData(prev => coerceAppState(liveData, prev));
                    }
                });
            }
        })();

        return () => {
            cancelled = true;
            if (unsub) unsub();
            setDataLoaded(false);
        };
    }, [user, activeTrackerId, coerceAppState]);

    useEffect(() => {
        if (!user || !dataLoaded || !activeTrackerId) return;

        if (skipNextWriteRef.current) {
            // Skip echoing writes caused by remote updates
            skipNextWriteRef.current = false;
            return;
        }

        const dbRef = ref(db, `trackers/${activeTrackerId}/state`);
        set(dbRef, data);
    }, [data, user, dataLoaded, activeTrackerId]);

    const handleReset = () => {
        setShowResetModal(true);
    };

    const handleConfirmReset = (mode: 'current' | 'all' | 'legendary') => {
        if (mode === 'all') {
            setData(createInitialState());
        } else if (mode === 'current') {
            setData(prev => {
                const base = createInitialState();
                return {
                    ...base,
                    rules: prev.rules, // keep rules on non-full reset
                    legendaryTrackerEnabled: prev.legendaryTrackerEnabled,
                    rivalCensorEnabled: prev.rivalCensorEnabled,
                    // Preserve level cap entries (id, arena, level) and only reset the done flag
                    levelCaps: prev.levelCaps.map(cap => ({ ...cap, done: false })),
                    rivalCaps: prev.rivalCaps.map(rc => ({ ...rc, done: false })),
                    stats: {
                        runs: prev.stats.runs + 1, // increase run number by 1
                        best: prev.stats.best, // keep persisted best
                        top4Items: { player1: 0, player2: 0 },
                        deaths: { player1: 0, player2: 0 },
                        sumDeaths: {
                            player1: (prev.stats.sumDeaths?.player1 ?? 0) + (prev.stats.deaths.player1 ?? 0),
                            player2: (prev.stats.sumDeaths?.player2 ?? 0) + (prev.stats.deaths.player2 ?? 0),
                        },
                        legendaryEncounters: prev.stats.legendaryEncounters ?? 0,
                    },
                };
            });
        } else if (mode === 'legendary') {
            handlelegendaryReset();
        }
        setShowResetModal(false);
    };

    const handleLogout = () => {
        setMobileMenuOpen(false);
        setShowSettings(false);
        setActiveTrackerId(null);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
        }
        navigate('/');
        signOut(auth);
    };

    const handleNavigateHome = () => {
        setMobileMenuOpen(false);
        navigate('/');
    };

    const updateNestedState = (
        setter: React.Dispatch<React.SetStateAction<AppState>>,
        key: keyof AppState,
        index: number,
        field: string,
        subField: string | null,
        value: string
    ) => {
        setter(prev => {
            const newArray = [...(prev[key] as any[])];
            if (subField) {
                newArray[index] = {
                    ...newArray[index],
                    [field]: {
                        ...newArray[index][field],
                        [subField]: value,
                    },
                };
            } else {
                newArray[index] = { ...newArray[index], [field]: value };
            }
            return {...prev, [key]: newArray};
        });
    };

    const handleTeamChange = useCallback((index: number, player: 'player1' | 'player2', field: string, value: string) => {
        updateNestedState(setData, 'team', index, player, field, value);
    }, []);

    const handleRouteChange = useCallback((index: number, value: string) => {
        updateNestedState(setData, 'team', index, 'route', null, value);
    }, []);

    const handleBoxChange = useCallback((index: number, player: 'player1' | 'player2', field: string, value: string) => {
        updateNestedState(setData, 'box', index, player, field, value);
    }, []);

    const handleBoxRouteChange = useCallback((index: number, value: string) => {
        updateNestedState(setData, 'box', index, 'route', null, value);
    }, []);

    const handleLevelCapChange = useCallback((index: number, value: string) => {
        updateNestedState(setData, 'levelCaps', index, 'level', null, value);
    }, []);

    const handleLevelCapToggle = useCallback((index: number) => {
        setData(prev => ({
            ...prev,
            levelCaps: prev.levelCaps.map((c, i) => i === index ? { ...c, done: !c.done } : c)
        }));
    }, []);

    const handleRivalCapToggleDone = useCallback((index: number) => {
        setData(prev => ({
            ...prev,
            rivalCaps: prev.rivalCaps.map((rc, i) => i === index ? { ...rc, done: !rc.done } : rc),
        }));
    }, []);

    const handleRivalCapReveal = useCallback((index: number) => {
        setData(prev => ({
            ...prev,
            rivalCaps: prev.rivalCaps.map((rc, i) => i === index ? { ...rc, revealed: true } : rc),
        }));
    }, []);

    const handleStatChange = (stat: keyof AppState['stats'], value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            setData(prev => ({...prev, stats: {...prev.stats, [stat]: numValue}}));
        }
    };

    const handleNestedStatChange = (group: keyof AppState['stats'], key: string, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            setData(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    [group]: {
                        ...(prev.stats[group] as object),
                        [key]: numValue,
                    }
                }
            }));
        }
    };

    const handleAddToGraveyard = useCallback((pair: PokemonPair) => {
        setPendingLossPair(pair);
        setShowLossModal(true);
    }, []);

    const handleConfirmLoss = (who: 'player1' | 'player2') => {
        if (!pendingLossPair) return;
        const pair = pendingLossPair;
        setData(prev => ({
            ...prev,
            graveyard: [...prev.graveyard, pair],
            team: prev.team.filter(p => p.id !== pair.id),
            box: prev.box.filter(p => p.id !== pair.id),
            stats: {
                ...prev.stats,
                deaths: {
                    player1: prev.stats.deaths.player1 + (who === 'player1' ? 1 : 0),
                    player2: prev.stats.deaths.player2 + (who === 'player2' ? 1 : 0),
                }
            }
        }));
        setShowLossModal(false);
        setPendingLossPair(null);
    };

    const handleManualAddToGraveyard = (pair: PokemonPair) => {
        setData(prev => ({
            ...prev,
            graveyard: [...prev.graveyard, pair],
        }));
    };

    const handleManualAddFromModal = (route: string, p1Pokemon: string, p2Pokemon: string) => {
        const newPair: PokemonPair = {
            id: Date.now(),
            route: route.trim(),
            player1: {name: p1Pokemon.trim(), nickname: ''},
            player2: {name: p2Pokemon.trim(), nickname: ''},
        };
        handleManualAddToGraveyard(newPair);
        setIsModalOpen(false);
    };

    const handleAddTeamPair = (payload: { route: string; p1Name: string; p1Nickname: string; p2Name: string; p2Nickname: string; }) => {
        setData(prev => {
            if (prev.team.length >= 6) return prev; // enforce 6 max
            return ({
                ...prev,
                team: [
                    ...prev.team,
                    {
                        id: Date.now(),
                        route: payload.route.trim(),
                        player1: { name: payload.p1Name.trim(), nickname: payload.p1Nickname.trim() },
                        player2: { name: payload.p2Name.trim(), nickname: payload.p2Nickname.trim() },
                    }
                ]
            });
        });
    };

    const handleAddBoxPair = (payload: { route: string; p1Name: string; p1Nickname: string; p2Name: string; p2Nickname: string; }) => {
        setData(prev => ({
            ...prev,
            box: [
                ...prev.box,
                {
                    id: Date.now(),
                    route: payload.route.trim(),
                    player1: { name: payload.p1Name.trim(), nickname: payload.p1Nickname.trim() },
                    player2: { name: payload.p2Name.trim(), nickname: payload.p2Nickname.trim() },
                }
            ]
        }));
    };

    const handleNameChange = (player: 'player1Name' | 'player2Name', name: string) => {
        setData(prev => ({...prev, [player]: name}));
        if (activeTrackerId) {
            update(ref(db, `trackers/${activeTrackerId}/meta`), { [player]: name });
        }
    };

    const handleTitleChange = (title: string) => {
        if (!activeTrackerId) return;
        setTrackerMetas(prev => {
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

    const handlelegendaryTrackerToggle = (enabled: boolean) => {
        setData(prev => ({ ...prev, legendaryTrackerEnabled: enabled }));
    };

    const handleRivalCensorToggle = (enabled: boolean) => {
        setData(prev => ({...prev, rivalCensorEnabled: enabled}));
    };

    const handlelegendaryReset = () => {
        setData(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                legendaryEncounters: 0,
            },
        }));
    };

    const handlelegendaryIncrement = () => {
        setData(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                legendaryEncounters: (prev.stats.legendaryEncounters ?? 0) + 1,
            },
        }));
    };

    const openCreateTrackerModal = () => {
        setCreateTrackerError(null);
        setShowCreateModal(true);
    };

    const handleOpenTracker = (trackerId: string) => {
        setActiveTrackerId(trackerId);
        navigate('/tracker');
    };

    const handleCreateTrackerSubmit = async (payload: { title: string; player1Name: string; player2Name: string; memberEmails: string[] }) => {
        if (!user) return;
        setCreateTrackerError(null);
        setCreateTrackerLoading(true);
        try {
            const result = await createTracker({
                title: payload.title,
                player1Name: payload.player1Name,
                player2Name: payload.player2Name,
                memberEmails: payload.memberEmails,
                owner: user,
            });
            const freshState = createInitialState();
            freshState.player1Name = result.meta.player1Name;
            freshState.player2Name = result.meta.player2Name;
            setData(freshState);
            setShowCreateModal(false);
            setActiveTrackerId(result.trackerId);
            navigate('/tracker');
        } catch (error) {
            if (error instanceof TrackerOperationError && error.code === 'user-not-found' && Array.isArray(error.details)) {
                setCreateTrackerError(`Folgende Emails wurden nicht gefunden: ${error.details.join(', ')}`);
            } else {
                setCreateTrackerError(error instanceof Error ? error.message : 'Tracker konnte nicht erstellt werden.');
            }
        } finally {
            setCreateTrackerLoading(false);
        }
    };

    const handleRequestTrackerDeletion = useCallback((trackerId: string) => {
        if (!user) return;
        const meta = trackerMetas[trackerId];
        if (!meta) return;
        const role = meta.members?.[user.uid]?.role;
        if (role !== 'owner') return;
        setDeleteTrackerError(null);
        setTrackerPendingDelete(meta);
    }, [trackerMetas, user]);

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
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(LAST_TRACKER_STORAGE_KEY);
                }
                navigate('/');
            }
            setTrackerPendingDelete(null);
        } catch (error) {
            setDeleteTrackerError(error instanceof Error ? error.message : 'Tracker konnte nicht gelöscht werden.');
        } finally {
            setDeleteTrackerLoading(false);
        }
    }, [trackerPendingDelete, activeTrackerId, navigate]);

    const handleInviteMember = useCallback(async (email: string) => {
        if (!activeTrackerId) {
            throw new Error('Kein aktiver Tracker ausgewählt.');
        }
        try {
            await addMemberByEmail(activeTrackerId, email);
        } catch (error) {
            if (error instanceof TrackerOperationError) {
                const details = Array.isArray(error.details) ? ` (${error.details.join(', ')})` : '';
                throw new Error(`${error.message}${details}`);
            }
            throw new Error('Mitglied konnte nicht hinzugefügt werden.');
        }
    }, [activeTrackerId]);

    const clearedRoutes = useMemo(() => {
        const routes: string[] = [];
        const collect = (arr: PokemonPair[] | undefined | null) => {
            const list = Array.isArray(arr) ? arr : [];
            for (const p of list) {
                const r = (p?.route || '').trim();
                if (r) routes.push(r);
            }
        };
        collect(data?.team as any);
        collect(data?.box as any);
        collect(data?.graveyard as any);
        // Unique + sort
        return Array.from(new Set(routes)).sort((a, b) => a.localeCompare(b));
    }, [data]);

    // Compute current best from completed arenas
    const currentBest = useMemo(() => {
        // Count only the first 8 arenas (exclude Top 4 and Champion)
        return Array.isArray(data.levelCaps)
            ? data.levelCaps.slice(0, 8).filter((c) => c && (c as any).done).length
            : 0;
    }, [data.levelCaps]);

    // Persist best if current progress exceeds stored best
    useEffect(() => {
        if (currentBest > (data.stats?.best ?? 0)) {
            setData(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    best: currentBest,
                }
            }));
        }
    }, [currentBest]);

    const trackerList = useMemo(
        () => userTrackerIds
            .map((id) => trackerMetas[id])
            .filter((meta): meta is TrackerMeta => Boolean(meta)),
        [userTrackerIds, trackerMetas]
    );
    const trackerListLoading = userTrackersLoading || (userTrackerIds.length > 0 && trackerList.length === 0);

    const activeTrackerMeta = activeTrackerId ? trackerMetas[activeTrackerId] : undefined;
    const trackerMembers = activeTrackerMeta ? Object.values(activeTrackerMeta.members ?? {}) : [];
    const canManageMembers = Boolean(user && activeTrackerMeta?.members?.[user.uid]?.role === 'owner');
    const nameTitleFallback = [data.player1Name, data.player2Name].map((n) => n?.trim()).filter(Boolean).join(' & ');
    const trackerTitleDisplay = activeTrackerMeta?.title?.trim() || nameTitleFallback || 'Soullink Tracker';

    // Show loading while auth is initializing, or while initial data is loading for an authenticated user
    if (loading || (user && !dataLoaded)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
                    <div className="h-10 w-10 border-4 border-gray-300 dark:border-gray-600 dark:border-t-blue-600 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Laden…</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return authScreen === 'login'
            ? <LoginPage onSwitchToRegister={() => setAuthScreen('register')}/>
            : <RegisterPage onSwitchToLogin={() => setAuthScreen('login')}/>;
    }

    const trackerElement = !activeTrackerId ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f0] dark:bg-gray-900 text-gray-700 dark:text-gray-200">
            <p className="text-lg font-semibold">Kein Tracker ausgewählt.</p>
            <p className="text-sm text-gray-500 mt-2">Bitte wähle einen Tracker auf der Startseite aus oder erstelle einen neuen.</p>
            <button
                onClick={handleNavigateHome}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
                Zur Übersicht
            </button>
        </div>
    ) : showSettings ? (
        <SettingsPage
            trackerTitle={activeTrackerMeta?.title ?? 'Tracker'}
            onTitleChange={handleTitleChange}
            player1Name={data.player1Name}
            player2Name={data.player2Name}
            onNameChange={handleNameChange}
            onBack={() => setShowSettings(false)}
            legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
            onlegendaryTrackerToggle={handlelegendaryTrackerToggle}
            rivalCensorEnabled={data.rivalCensorEnabled ?? true}
            onRivalCensorToggle={handleRivalCensorToggle}
            members={trackerMembers}
            onInviteMember={handleInviteMember}
            canManageMembers={canManageMembers}
            currentUserEmail={user?.email}
        />
    ) : (
        <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 text-gray-800 dark:text-gray-200">
            <AddLostPokemonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleManualAddFromModal}
                player1Name={data.player1Name}
                player2Name={data.player2Name}
            />
            <SelectLossModal
                isOpen={showLossModal}
                onClose={() => { setShowLossModal(false); setPendingLossPair(null); }}
                onConfirm={handleConfirmLoss}
                pair={pendingLossPair}
                player1Name={data.player1Name}
                player2Name={data.player2Name}
            />
            <ResetModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleConfirmReset}
                legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
            />
            <div className="max-w-[1920px] mx-auto bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg">
                <header className="relative text-center py-4 border-b-2 border-gray-300 dark:border-gray-700">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-bold font-press-start tracking-tighter dark:text-gray-100">
                        {trackerTitleDisplay}
                    </h1>
                    {nameTitleFallback && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{nameTitleFallback}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pokémon Soullink - Challenge Tracker</p>
                    <div className="absolute right-2 sm:right-4 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
                        {/* Desktop icons (>=xl) */}
                        <div className="hidden xl:flex items-center gap-1 sm:gap-2">
                            <DarkModeToggle />
                            <button
                                onClick={handleNavigateHome}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
                                aria-label="Zur Übersicht"
                                title="Zur Übersicht"
                            >
                                <FiHome size={28} />
                            </button>
                            <button
                                onClick={handleReset}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
                                aria-label="Tracker zurücksetzen"
                                title="Tracker zurücksetzen"
                            >
                                <FiRotateCw size={28} />
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
                                aria-label="Einstellungen"
                                title="Einstellungen"
                            >
                                <FiSettings size={28} />
                            </button>
                        </div>
                        {/* Mobile burger (<xl) */}
                        <button
                            className="xl:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none"
                            aria-label="Menü"
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen(v => !v)}
                        >
                            <FiMenu size={26} />
                        </button>
                    </div>
                </header>

                {/* Mobile side drawer + backdrop */}
                <div className="xl:hidden">
                    {/* Backdrop for outside click */}
                    <div
                        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} z-40`}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden
                    />
                    {/* Sliding panel */}
                    <div
                        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} z-50`}
                        role="dialog"
                        aria-label="Mobile Menü"
                    >
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Menü</span>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                aria-label="Menü schließen"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => { const next = !isDark; setDarkMode(next); setIsDark(next); }}
                                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                                title={isDark ? 'Tageslichtmodus' : 'Dunkelmodus'}
                            >
                                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                                {isDark ? 'Tageslichtmodus' : 'Dunkelmodus'}
                            </button>
                            <button
                                onClick={handleNavigateHome}
                                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                                title="Zur Übersicht"
                            >
                                <FiHome size={18} /> Übersicht
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); handleReset(); }}
                                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                                title="Tracker zurücksetzen"
                            >
                                <FiRotateCw size={18} /> Tracker zurücksetzen
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); setShowSettings(true); }}
                                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                                title="Einstellungen"
                            >
                                <FiSettings size={18} /> Einstellungen
                            </button>
                        </div>
                    </div>
                </div>

                <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                    <div className="xl:col-span-2 space-y-8">
                        <TeamTable
                            title={`Team ${data.player1Name}`}
                            title2={`Team ${data.player2Name}`}
                            color1={PLAYER1_COLOR}
                            color2={PLAYER2_COLOR}
                            data={data.team}
                            onPokemonChange={handleTeamChange}
                            onRouteChange={handleRouteChange}
                            onAddToGraveyard={handleAddToGraveyard}
                            player1Name={data.player1Name}
                            player2Name={data.player2Name}
                            onAddPair={handleAddTeamPair}
                            emptyMessage="Noch keine Pokémon im Team"
                            addDisabled={data.team.length >= 6}
                            addDisabledReason="Team ist voll (max 6)"
                            context="team"
                            onMoveToTeam={() => {}}
                            onMoveToBox={(pair) => setData(prev => ({
                                ...prev,
                                team: prev.team.filter(p => p.id !== pair.id),
                                box: [...prev.box, pair],
                            }))}
                        />
                        <TeamTable
                            title={`Box ${data.player1Name}`}
                            title2={`Box ${data.player2Name}`}
                            color1={PLAYER1_COLOR}
                            color2={PLAYER2_COLOR}
                            data={data.box}
                            onPokemonChange={handleBoxChange}
                            onRouteChange={handleBoxRouteChange}
                            onAddToGraveyard={handleAddToGraveyard}
                            player1Name={data.player1Name}
                            player2Name={data.player2Name}
                            onAddPair={handleAddBoxPair}
                            emptyMessage="Noch keine Pokémon in der Box"
                            context="box"
                            onMoveToTeam={(pair) => setData(prev => {
                                if (prev.team.length >= 6) return prev;
                                return {
                                    ...prev,
                                    box: prev.box.filter(p => p.id !== pair.id),
                                    team: [...prev.team, pair],
                                };
                            })}
                            onMoveToBox={() => {}}
                            teamIsFull={data.team.length >= 6}
                        />
                    </div>

                    <div className="xl:col-span-1 space-y-6">
                        <InfoPanel
                            levelCaps={data.levelCaps}
                            rivalCaps={data.rivalCaps}
                            stats={{...data.stats, best: Math.max(data.stats.best, currentBest)}}
                            player1Name={data.player1Name}
                            player2Name={data.player2Name}
                            onLevelCapChange={handleLevelCapChange}
                            onLevelCapToggle={handleLevelCapToggle}
                            onRivalCapToggleDone={handleRivalCapToggleDone}
                            onRivalCapReveal={handleRivalCapReveal}
                            onStatChange={handleStatChange}
                            onNestedStatChange={handleNestedStatChange}
                            rules={data.rules}
                            onRulesChange={(rules) => setData(prev => ({ ...prev, rules }))}
                            legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
                            rivalCensorEnabled={data.rivalCensorEnabled ?? true}
                            onlegendaryIncrement={handlelegendaryIncrement}
                        />
                        <Graveyard
                            graveyard={data.graveyard}
                            player1Name={data.player1Name}
                            player2Name={data.player2Name}
                            onManualAddClick={() => setIsModalOpen(true)}
                        />
                        <ClearedRoutes routes={clearedRoutes}/>
                    </div>
                </main>
                <footer className="text-center mt-8 py-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <a
                        href="https://github.com/joos-too/Pokemon-Soullink-Tracker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="View on GitHub"
                    >
                        <FaGithub size={18} aria-hidden="true" />
                        <span className="text-sm">vibecoded by joos-too & FreakMediaLP</span>
                    </a>
                </footer>
            </div>
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
                            onLogout={handleLogout}
                            onCreateTracker={openCreateTrackerModal}
                            isLoading={trackerListLoading}
                            activeTrackerId={activeTrackerId}
                            userEmail={user?.email ?? undefined}
                            onDeleteTracker={handleRequestTrackerDeletion}
                            currentUserId={user?.uid ?? null}
                            trackerSummaries={trackerSummaries}
                        />
                    }
                />
                <Route path="/tracker" element={trackerElement} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default App;
