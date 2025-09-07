import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import { FiTrash2, FiLogOut, FiSettings } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import type {AppState, PokemonPair} from '@/types';
import {INITIAL_STATE, PLAYER1_COLOR, PLAYER2_COLOR} from '@/constants';
import TeamTable from '@/src/components/TeamTable';
import InfoPanel from '@/src/components/InfoPanel';
import Graveyard from '@/src/components/Graveyard';
import ClearedRoutes from '@/src/components/ClearedRoutes';
import AddLostPokemonModal from '@/src/components/AddLostPokemonModal';
import LoginPage from '@/src/components/LoginPage';
import SettingsPage from '@/src/components/SettingsPage';
import ResetModal from '@/src/components/ResetModal';
import {db, auth} from '@/src/firebaseConfig';
import {ref, onValue, set, get} from "firebase/database";
import {onAuthStateChanged, User, signOut} from "firebase/auth";

const App: React.FC = () => {
    const [data, setData] = useState<AppState>(INITIAL_STATE);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const skipNextWriteRef = useRef(false);

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
            },
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
    }, [user]);

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

    const handleConfirmReset = (mode: 'current' | 'all') => {
        if (mode === 'all') {
            setData(INITIAL_STATE);
        } else {
            setData(prev => ({
                ...INITIAL_STATE,
                stats: {
                    ...prev.stats,
                    runs: prev.stats.runs, // keep current run number
                    best: prev.stats.best, // keep persisted best
                    top4Items: { player1: 0, player2: 0 },
                    deaths: { player1: 0, player2: 0 },
                },
            }));
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
        setData(prev => ({
            ...prev,
            graveyard: [...prev.graveyard, pair],
            team: prev.team.map(p => p.id === pair.id ? INITIAL_STATE.team.find(ip => ip.id === pair.id) || p : p),
            box: prev.box.map(p => p.id === pair.id ? INITIAL_STATE.box.find(ip => ip.id === pair.id) || p : p),
            stats: {
                ...prev.stats,
                deaths: {
                    player1: prev.stats.deaths.player1 + 1,
                    player2: prev.stats.deaths.player2 + 1
                }
            }
        }));
    }, []);

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

    const handleNameChange = (player: 'player1Name' | 'player2Name', name: string) => {
        setData(prev => ({...prev, [player]: name}));
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
                <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
                    <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-gray-600 text-sm">Loading…</span>
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
            />
        );
    }

    return (
        <div className="bg-[#f0f0f0] min-h-screen p-2 sm:p-4 md:p-8 text-gray-800">
            <AddLostPokemonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleManualAddFromModal}
                player1Name={data.player1Name}
                player2Name={data.player2Name}
            />
            <ResetModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleConfirmReset}
            />
            <div className="max-w-[1920px] mx-auto bg-white shadow-lg p-4 rounded-lg">
                <header className="relative text-center py-4 border-b-2 border-gray-300">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start tracking-tighter">
                        {data.player1Name} & {data.player2Name} Soullink
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">Pokemon Soullink - Challenge Tracker</p>
                    <div className="absolute right-2 sm:right-4 top-2 sm:top-3 flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={handleReset}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:outline-none"
                            aria-label="Tracker zurücksetzen"
                            title="Tracker zurücksetzen"
                        >
                            <FiTrash2 size={28} />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:outline-none"
                            aria-label="Einstellungen"
                            title="Einstellungen"
                        >
                            <FiSettings size={28} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:outline-none"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FiLogOut size={28} />
                        </button>
                    </div>
                </header>

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
                <footer className="text-center mt-8 py-4 border-t-2 border-gray-200">
                    <a
                        href="https://github.com/joos-too/Pokemon-Soullink-Tracker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        title="View on GitHub"
                    >
                        <FaGithub size={18} aria-hidden="true" />
                        <span className="text-sm">vibecoded by joos-too</span>
                    </a>
                </footer>
            </div>
        </div>
    );
};

export default App;
