import React, {useState, useMemo, useEffect} from 'react';
import type {LevelCap, RivalCap, Stats, GameVersion, UserSettings} from '@/types';
import {PLAYER_COLORS, LEGENDARY_POKEMON_NAMES} from '@/constants';
import {FiMinus, FiPlus, FiEdit, FiX, FiSave, FiEye, FiEyeOff, FiRefreshCw} from 'react-icons/fi';
import {RivalImage, BadgeImage, LegendaryImage} from './GameImages';

interface InfoPanelProps {
    playerNames: string[];
    playerColors: string[];
    levelCaps: LevelCap[];
    rivalCaps: RivalCap[];
    stats: Stats;
    onLevelCapToggle: (index: number) => void;
    onRivalCapToggleDone: (index: number) => void;
    onRivalCapReveal: (index: number) => void;
    onStatChange: (stat: keyof Stats, value: string) => void;
    onPlayerStatChange: (group: keyof Stats, playerIndex: number, value: string) => void;
    rules: string[];
    onRulesChange: (rules: string[]) => void;
    legendaryTrackerEnabled: boolean;
    rivalCensorEnabled: boolean;
    hardcoreModeEnabled?: boolean;
    onlegendaryIncrement: () => void;
    onlegendaryDecrement: () => void;
    runStartedAt?: number;
    gameVersion?: GameVersion;
    rivalPreferences: UserSettings['rivalPreferences'];
    activeTrackerId?: string | null;
}


const InfoPanel: React.FC<InfoPanelProps> = ({
                                                 playerNames,
                                                 playerColors,
                                                 levelCaps,
                                                 rivalCaps,
                                                 stats,
                                                 onLevelCapToggle,
                                                 onRivalCapToggleDone,
                                                 onRivalCapReveal,
                                                 onPlayerStatChange,
                                                 rules,
                                                 onRulesChange,
                                                 legendaryTrackerEnabled,
                                                 rivalCensorEnabled,
                                                 hardcoreModeEnabled,
                                                 onlegendaryIncrement,
                                                 onlegendaryDecrement,
                                                 runStartedAt,
                                                 gameVersion,
                                                 rivalPreferences,
                                                 activeTrackerId,
                                             }) => {
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [draftRules, setDraftRules] = useState<string[]>(rules);
    const trackerViewStorageKey = activeTrackerId ? `soullink:tracker:${activeTrackerId}:caps-view` : null;
    const readStoredCapsView = (key: string | null): boolean => {
        if (!key || typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem(key) === 'rivals';
        } catch {
            return false;
        }
    };
    const [showRivalCaps, setShowRivalCaps] = useState<boolean>(() => readStoredCapsView(trackerViewStorageKey));
    const [isMobile, setIsMobile] = useState(false);
    const getPlayerColor = (index: number) => playerColors[index] ?? PLAYER_COLORS[index] ?? '#4b5563';

    useEffect(() => {
        setShowRivalCaps(readStoredCapsView(trackerViewStorageKey));
    }, [trackerViewStorageKey]);

    const toggleCapsView = () => {
        setShowRivalCaps(prev => {
            const next = !prev;
            if (trackerViewStorageKey && typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(trackerViewStorageKey, next ? 'rivals' : 'levels');
                } catch {
                    // ignore storage errors
                }
            }
            return next;
        });
    };

    const randomLegendary = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * LEGENDARY_POKEMON_NAMES.length);
        return LEGENDARY_POKEMON_NAMES[randomIndex];
    }, []);

    const nextRivalToRevealIndex = rivalCensorEnabled ? rivalCaps.findIndex(rc => !rc.revealed) : -1;

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
        setIsMobile(mediaQuery.matches);
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    const doneArenas = levelCaps.filter(c => c.done).length;
    const doneRivals = rivalCaps.filter(r => r.done).length;
    const totalMilestones = (levelCaps.length || 0) + (rivalCaps.length || 0);
    const completedMilestones = Math.min(doneArenas + doneRivals, totalMilestones);
    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    const deathStats = playerNames.map((name, index) => {
        const deaths = stats.deaths?.[index] ?? 0;
        const historic = stats.sumDeaths?.[index] ?? 0;
        return {
            name,
            color: getPlayerColor(index),
            deaths,
            total: historic + deaths,
            borderClass: index < playerNames.length - 1 ? 'border-r border-gray-300 dark:border-gray-700' : '',
        };
    });

    const startEditRules = () => {
        setDraftRules(rules);
        setIsEditingRules(true);
    };
    const cancelEditRules = () => {
        setIsEditingRules(false);
        setDraftRules(rules);
    };
    const saveEditRules = () => {
        const cleaned = draftRules.map(r => r.trim()).filter(r => r.length > 0);
        onRulesChange(cleaned);
        setIsEditingRules(false);
    };
    const addNewRule = () => {
        setDraftRules(prev => [...prev, ""]);
    };

    const renderLevelCaps = (level: string) => {
        const hc = hardcoreModeEnabled !== false; // default true
        const hasSlash = level.includes('/');
        const [leftRaw, rightRaw] = hasSlash ? level.split('/') : [level, undefined];
        const left = (leftRaw || '').trim();
        const right = (rightRaw || '').trim();

        if (!hc) {
            const show = hasSlash ? left : (left || right || '');
            return (
                <div className="inline-flex items-center pl-1">
                    <span className="min-w-[2.5rem] px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-bold text-gray-800 dark:text-gray-200 text-center">
                        {show}
                    </span>
                </div>
            );
        }

        const leftDisplay = hasSlash ? left : left;
        const rightDisplay = hasSlash ? right : '-';
        return (
            <div className="inline-flex items-center gap-1 pl-1">
                <span className="min-w-8 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-bold text-gray-800 dark:text-gray-200 text-center">
                    {leftDisplay}
                </span>
                <span className="min-w-8 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-bold text-gray-800 dark:text-gray-200 text-center">
                    {rightDisplay}
                </span>
            </div>
        );
    };

    const renderLevelCapList = (wrapperClasses: string) => (
        <div className={wrapperClasses}>
            {levelCaps.map((cap, index) => (
                <div key={cap.id}
                     className={`flex items-center justify-between pl-2 py-1.5 border rounded-md ${cap.done ? 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                        <input id={`levelcap-done-${cap.id}`} type="checkbox"
                               checked={!!cap.done}
                               onChange={() => onLevelCapToggle(index)}
                               aria-label={`Erledigt: ${cap.arena}`}
                               className="h-5 w-5 accent-green-600 cursor-pointer flex-shrink-0"/>
                        <span className="text-sm text-gray-800 dark:text-gray-300 break-words">{cap.arena}</span>
                    </div>
                    <div className="flex items-center justify-end flex-shrink-0 px-3">
                        <BadgeImage
                            arenaLabel={cap.arena}
                            posIndex={index}
                            badgeSet={gameVersion?.badgeSet}
                        />
                        <span
                            className="font-bold text-lg text-gray-800 dark:text-gray-200 text-center">{renderLevelCaps(cap.level)}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderRivalCapList = (wrapperClasses: string) => (
        <div className={wrapperClasses}>
            {rivalCaps.map((rc, index) => (
                <div key={rc.id}>
                    {rivalCensorEnabled && !rc.revealed ? (
                        <>
                            {index === nextRivalToRevealIndex ? (
                                <button onClick={() => onRivalCapReveal(index)}
                                        className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    <FiEye size={16}/> Nächsten Rivalen aufdecken
                                </button>
                            ) : (
                                <div
                                    className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-600">
                                    <FiEyeOff size={16}/> Zukünftiger Kampf
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            className={`flex items-center justify-between pl-2 py-1.5 border rounded-md ${rc.done ? 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                                <input id={`rivalcap-done-${rc.id}`} type="checkbox"
                                       checked={!!rc.done}
                                       onChange={() => onRivalCapToggleDone(index)}
                                       aria-label={`Erledigt: ${typeof rc.rival === 'object' ? rc.rival.name : rc.rival}`}
                                       className="h-5 w-5 accent-green-600 cursor-pointer flex-shrink-0"/>
                                <span
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm text-gray-800 dark:text-gray-300 break-words">{rc.location}</span>
                            </div>
                            <div className="flex items-center justify-end flex-shrink-0 px-3">
                                <RivalImage rival={rc.rival} preferences={rivalPreferences}/>
                                <span
                                    className="font-bold text-lg text-gray-800 dark:text-gray-200 text-center">{renderLevelCaps(rc.level)}</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-blue-600 text-white font-press-start text-[10px]">Aktueller
                            Level Cap</h2>
                        <div className="p-1 text-l text-gray-800 dark:text-gray-200 text-center space-y-1">
                            <div className="min-h-20 flex flex-col items-center justify-center">
                                {(() => {
                                    const next = levelCaps.find((c) => !c.done);
                                    if (!next) return <span className="text-xl font-bold">Challenge geschafft!</span>;
                                    return (
                                        <div className="flex items-center justify-center px-3 gap-x-4">
                                            <BadgeImage
                                                arenaLabel={next.arena}
                                                posIndex={Math.max(levelCaps.findIndex(c => c.id === next.id), 0)}
                                                badgeSet={gameVersion?.badgeSet}
                                                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                                            />
                                            <div className="flex flex-col items-center">
                                                <div className="flex flex-wrap justify-center items-baseline gap-x-1">
                                                    <span>Aktuell:</span>
                                                    <strong>{next.arena}</strong>
                                                </div>
                                                <div>Level Cap: <strong>{next.level}</strong></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            {typeof runStartedAt === 'number' && runStartedAt > 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-">
                                    Run Gestartet: {new Date(runStartedAt).toLocaleString('de-DE', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                })} Uhr
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <div
                                className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                                <span>Fortschritt</span>
                                <span
                                    className="font-semibold">{completedMilestones}/{totalMilestones} · {progressPct}%</span>
                            </div>
                            <div className="relative h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                                 aria-label="Fortschritt" role="progressbar" aria-valuenow={progressPct}
                                 aria-valuemin={0} aria-valuemax={100}>
                                <div
                                    className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-[inset_0_0_6px_rgba(0,0,0,0.25)]"
                                    style={{width: `${progressPct}%`}}
                                />
                                <div
                                    className="absolute inset-0 [mask-image:radial-gradient(transparent,black)] opacity-20 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-blue-600 text-white font-press-start text-[10px]">Run
                            Stats</h2>
                        <table className="w-full">
                            <tbody>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">Aktueller
                                    Run
                                </td>
                                <td className="px-2 py-1.5 text-right"><span
                                    className="inline-block min-w-[2ch] text-sm font-bold">Run {stats.runs}</span></td>
                            </tr>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">Bester
                                    Run
                                </td>
                                <td className="px-2 py-1.5 text-right"><span
                                    className="inline-block min-w-[2ch] text-sm font-bold">Arena {stats.best}</span>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-blue-600 text-white font-press-start text-[10px]">Top 4
                            Items</h2>
                        <table className="w-full">
                            <tbody>
                            {playerNames.map((name, index) => {
                                const value = stats.top4Items?.[index] ?? 0;
                                return (
                                    <tr key={`top4-${index}`} className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="px-2 py-1.5 text-xs font-bold" style={{color: getPlayerColor(index)}}>
                                            {name}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button type="button"
                                                        onClick={() => onPlayerStatChange('top4Items', index, String(Math.max(0, value - 1)))}
                                                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                        aria-label="Items verringern" title="Items verringern"><FiMinus
                                                    size={16}/>
                                                </button>
                                                <input type="number"
                                                       value={value}
                                                       onChange={(e) => onPlayerStatChange('top4Items', index, e.target.value)}
                                                       className="w-16 text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"/>
                                                <button type="button"
                                                        onClick={() => onPlayerStatChange('top4Items', index, String(value + 1))}
                                                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                        aria-label="Items erhöhen" title="Items erhöhen"><FiPlus
                                                    size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col"
                    style={{perspective: '1000px'}}>
                    <div className="relative flex-shrink-0">
                        <h2 className="text-center p-2 text-white font-press-start text-[10px] transition-colors duration-500"
                            style={{backgroundColor: showRivalCaps ? '#693992' : '#cf5930'}}>
                            {showRivalCaps ? 'Rivalenkämpfe' : 'Arenen'}
                        </h2>
                        <button onClick={toggleCapsView}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25"
                                title="Ansicht wechseln">
                            <FiRefreshCw size={14}
                                         className={`transition-transform duration-500 ${showRivalCaps ? 'rotate-180' : ''}`}/>
                        </button>
                    </div>

                    {isMobile ? (
                        showRivalCaps
                            ? renderRivalCapList('p-2 space-y-1 max-h-[50vh] overflow-y-auto overscroll-contain custom-scrollbar')
                            : renderLevelCapList('p-2 space-y-1 max-h-[50vh] overflow-y-auto overscroll-contain custom-scrollbar')
                    ) : (
                        <div className={`relative flex-grow min-h-0 transition-transform duration-700`}
                             style={{
                                 transformStyle: 'preserve-3d',
                                 transform: showRivalCaps ? 'rotateY(180deg)' : 'rotateY(0deg)'
                             }}>
                            <div className={`absolute w-full h-full ${showRivalCaps ? 'pointer-events-none' : 'pointer-events-auto'}`}
                                 style={{
                                     backfaceVisibility: 'hidden',
                                     transform: 'rotateY(0deg)'
                                 }}>
                                {renderLevelCapList('p-2 h-full overflow-y-auto space-y-1 overscroll-contain custom-scrollbar')}
                            </div>

                            <div className={`absolute w-full h-full ${showRivalCaps ? 'pointer-events-auto' : 'pointer-events-none'}`}
                                 style={{
                                     backfaceVisibility: 'hidden',
                                     transform: 'rotateY(180deg)'
                                 }}>
                                {renderRivalCapList('p-2 h-full overflow-y-auto space-y-1 overscroll-contain custom-scrollbar')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`grid grid-cols-1 ${legendaryTrackerEnabled ? 'md:grid-cols-2' : ''} gap-6`}>
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <h2 className="text-center p-2 bg-gray-800 dark:bg-gray-900 text-white font-press-start text-sm">Tode</h2>
                    <div className="grid gap-y-1" style={{gridTemplateColumns: `repeat(${playerNames.length}, minmax(0, 1fr))`}}>
                        {deathStats.map((entry, index) => (
                            <div key={`death-name-${index}`} className={`px-2 pt-2 pb-1 text-center ${entry.borderClass}`}>
                                <h3 className="font-press-start text-xs whitespace-normal break-words leading-tight" style={{color: entry.color}}>{entry.name}</h3>
                            </div>
                        ))}
                        {deathStats.map((entry, index) => (
                            <div key={`death-count-${index}`} className={`px-2 py-2 text-center ${entry.borderClass}`}>
                                <div className="text-4xl font-press-start text-gray-800 dark:text-gray-200">{entry.deaths}</div>
                            </div>
                        ))}
                        {deathStats.map((entry, index) => (
                            <div key={`death-total-${index}`} className={`px-2 pb-2 text-center ${entry.borderClass}`}>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Gesamt: {entry.total}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {legendaryTrackerEnabled && (
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300
                        dark:border-gray-700 overflow-hidden hover:bg-gray-100 active:bg-gray-200
                        dark:hover:bg-gray-700 dark:active:bg-gray-600 duration-200 cursor-pointer select-none flex flex-col h-full"
                        onClick={onlegendaryIncrement}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onlegendaryDecrement(); }}
                        title="Linksklick: erhöhen · Rechtsklick: verringern"
                    >
                        <h2 className="text-center p-2 text-black font-press-start text-[13.5px]"
                            style={{backgroundColor: '#cfcfc3'}}>
                            Legendären begegnet
                        </h2>
                        <div className="p-4 flex items-center justify-center flex-grow">
                            <div className="flex items-center justify-center gap-3 w-full max-w-sm">
                                <div
                                    className="flex-shrink-0"
                                    style={{width: '4.5rem', height: '4.5rem'}}
                                >
                                    <LegendaryImage
                                        pokemonName={randomLegendary}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div
                                    className="font-press-start text-gray-800 dark:text-gray-200 leading-none text-right"
                                    style={{fontSize: '2.5rem'}}
                                >
                                    {stats.legendaryEncounters ?? 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                <div className="relative">
                    <h2 className="text-center p-2 text-white font-press-start text-sm"
                        style={{backgroundColor: '#34a853'}}>Regeln</h2>
                    <div className="absolute right-2 top-1.5 flex items-center gap-2">
                        {!isEditingRules ? (
                            <button type="button" onClick={startEditRules}
                                    className="px-2 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1 shadow"
                                    title="Regeln bearbeiten"><FiEdit size={14}/> Bearbeiten</button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={cancelEditRules}
                                        className="px-2 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1 shadow"
                                        title="Abbrechen"><FiX size={14}/> Abbrechen
                                </button>
                                <button type="button" onClick={saveEditRules}
                                        className="px-2 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1 shadow"
                                        title="Speichern"><FiSave size={14}/> Speichern
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {!isEditingRules ? (
                    <ul className="p-4 space-y-2 text-xs list-decimal list-inside text-gray-700 dark:text-gray-300">
                        {rules.map((rule, index) => <li key={index}>{rule}</li>)}
                    </ul>
                ) : (
                    <div className="p-4 space-y-2">
                        {draftRules.map((rule, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <span
                                    className="mt-2 text-xs text-gray-500 dark:text-gray-400 w-4 text-right">{index + 1}.</span>
                                <input type="text" value={rule}
                                       onChange={(e) => setDraftRules(prev => prev.map((r, i) => i === index ? e.target.value : r))}
                                       placeholder={`Regel ${index + 1}`}
                                       className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                            </div>
                        ))}
                        <div className="pt-2">
                            <button type="button" onClick={addNewRule}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    title="Neue Regel hinzufügen"><FiPlus size={14}/> Neue Regel
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default InfoPanel;
