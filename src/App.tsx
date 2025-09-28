import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {FiLogOut, FiSettings, FiRotateCw, FiMenu, FiSun, FiMoon} from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import type {AppState, PokemonPair} from '@/types';
import {INITIAL_STATE, PLAYER1_COLOR, PLAYER2_COLOR, DEFAULT_RULES} from '@/constants';
import TeamTable from '@/src/components/TeamTable';
import InfoPanel from '@/src/components/InfoPanel';
import Graveyard from '@/src/components/Graveyard';
import ClearedRoutes from '@/src/components/ClearedRoutes';
import AddLostPokemonModal from '@/src/components/AddLostPokemonModal';
import SelectLossModal from '@/src/components/SelectLossModal';
import LoginPage from '@/src/components/LoginPage';
import SettingsPage from '@/src/components/SettingsPage';
import ResetModal from '@/src/components/ResetModal';
import DarkModeToggle, { getDarkMode, setDarkMode } from '@/src/components/DarkModeToggle';
import {db, auth} from '@/src/firebaseConfig';
import {ref, onValue, set, get} from "firebase/database";
import {onAuthStateChanged, User, signOut} from "firebase/auth";
import { initPokemonGermanNamesBackgroundRefresh } from '@/src/services/pokemonSearch';

const App: React.FC = () => {
    const [data, setData] = useState<AppState>(INITIAL_STATE);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const skipNextWriteRef = useRef(false);
    const [showLossModal, setShowLossModal] = useState(false);
    const [pendingLossPair, setPendingLossPair] = useState<PokemonPair | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(getDarkMode());

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
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
        if (!user) return;

        const dbRef = ref(db, '/');

        // 1) Load once on initial login
        let unsub: (() => void) | undefined;
        (async () => {
            try {
                const snapshot = await get(dbRef);
                const dbData = snapshot.val();
                if (dbData) {
                    // Apply remote state without echoing back immediately
                    skipNextWriteRef.current = true;
                    setData(prev => coerceAppState(dbData, prev));
                }
            } catch (e) {
                // If get fails, fall back to initial state silently
                // (data is already INITIAL_STATE by default)
            } finally {
                setDataLoaded(true);
                // 2) Subscribe for live updates after initial load
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
            if (unsub) unsub();
            setDataLoaded(false);
        };
    }, [user, coerceAppState]);

    useEffect(() => {
        if (!user || !dataLoaded) return;

        if (skipNextWriteRef.current) {
            // Skip echoing writes caused by remote updates
            skipNextWriteRef.current = false;
            return;
        }

        const dbRef = ref(db, '/');
        set(dbRef, data);
    }, [data, user, dataLoaded]);

    const handleReset = () => {
        setShowResetModal(true);
    };

    const handleConfirmReset = (mode: 'current' | 'all' | 'legendary') => {
        if (mode === 'all') {
            setData(INITIAL_STATE);
        } else if (mode === 'current') {
            setData(prev => ({
                ...INITIAL_STATE,
                rules: prev.rules, // keep rules on non-full reset
                legendaryTrackerEnabled: prev.legendaryTrackerEnabled,
                // Preserve level cap entries (id, arena, level) and only reset the done flag
                levelCaps: prev.levelCaps.map(cap => ({ ...cap, done: false })),
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
            }));
        } else if (mode === 'legendary') {
            handlelegendaryReset();
        }
        setShowResetModal(false);
    };

    const handleLogout = () => {
        signOut(auth);
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
                newArray[index] = {
                    ...newArray[index],
                    [field]: value,
                };
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
    };

    const handlelegendaryTrackerToggle = (enabled: boolean) => {
        setData(prev => ({ ...prev, legendaryTrackerEnabled: enabled }));
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
        return <LoginPage/>;
    }

    if (showSettings) {
        return (
            <SettingsPage
                player1Name={data.player1Name}
                player2Name={data.player2Name}
                onNameChange={handleNameChange}
                onBack={() => setShowSettings(false)}
                legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
                onlegendaryTrackerToggle={handlelegendaryTrackerToggle}
            />
        );
    }

    return (
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
                    {/* Logo oben links */}
                    <div className="absolute left-2 sm:left-4 top-2 sm:top-3 z-30 flex items-center">
                        <img
                            src="/Soullinktracker-Logo - cropped.png"
                            alt="Soullink Logo"
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-bold font-press-start tracking-tighter dark:text-gray-100">
                        {data.player1Name} & {data.player2Name} Soullink
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Pokémon Soullink - Challenge Tracker</p>
                    <div className="absolute right-2 sm:right-4 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
                        {/* Desktop icons (>=xl) */}
                        <div className="hidden xl:flex items-center gap-1 sm:gap-2">
                            <DarkModeToggle />
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
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <FiLogOut size={28} />
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
                            <button
                                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                className="w-full text-left px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
                                title="Abmelden"
                            >
                                <FiLogOut size={18} /> Abmelden
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
                            stats={{...data.stats, best: Math.max(data.stats.best, currentBest)}}
                            player1Name={data.player1Name}
                            player2Name={data.player2Name}
                            onLevelCapChange={handleLevelCapChange}
                            onLevelCapToggle={handleLevelCapToggle}
                            onStatChange={handleStatChange}
                            onNestedStatChange={handleNestedStatChange}
                            rules={data.rules}
                            onRulesChange={(rules) => setData(prev => ({ ...prev, rules }))}
                            legendaryTrackerEnabled={data.legendaryTrackerEnabled ?? true}
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
};

export default App;
