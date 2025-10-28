import React, {useState, useMemo} from 'react';
import type {LevelCap, RivalCap, Stats} from '@/types';
import {PLAYER1_COLOR, PLAYER2_COLOR, LEGENDARY_POKEMON_NAMES} from '@/constants';
import {FiMinus, FiPlus, FiEdit, FiX, FiSave, FiEye, FiEyeOff, FiRefreshCw} from 'react-icons/fi';
import {getSpriteUrlForGermanName} from '@/src/services/sprites';

interface InfoPanelProps {
    player1Name: string;
    player2Name: string;
    levelCaps: LevelCap[];
    rivalCaps: RivalCap[];
    stats: Stats;
    onLevelCapToggle: (index: number) => void;
    onRivalCapToggleDone: (index: number) => void;
    onRivalCapReveal: (index: number) => void;
    onStatChange: (stat: keyof Stats, value: string) => void;
    onNestedStatChange: (group: keyof Stats, key: string, value: string) => void;
    rules: string[];
    onRulesChange: (rules: string[]) => void;
    legendaryTrackerEnabled: boolean;
    rivalCensorEnabled: boolean;
    onlegendaryIncrement: () => void;
    runStartedAt?: number;
}

const RivalImage: React.FC<{ name: string }> = ({name}) => {
    const imageName = name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/[^a-z0-9_]/g, '') + '.png';
    const imagePath = `/rival-sprites/${imageName}`;
    return <img
        src={imagePath}
        alt={name}
        title={name}
        className="w-8 h-8 object-contain mx-auto"
    />;
};

const getBadgeUrl = (arenaLabel: string, posIndex: number): string => {
    const label = (arenaLabel || '').toLowerCase();
    if (label.includes('top 4')) return '/badge-sprites/top_4.png';
    if (label.includes('champ')) return '/champ-sprites/lilia.png';
    const pos = Math.min(Math.max(posIndex + 1, 1), 8);
    return `/badge-sprites/gen5/bw/${pos}.png`;
};

const InfoPanel: React.FC<InfoPanelProps> = ({
                                                 player1Name,
                                                 player2Name,
                                                 levelCaps,
                                                 rivalCaps,
                                                 stats,
                                                 onLevelCapToggle,
                                                 onRivalCapToggleDone,
                                                 onRivalCapReveal,
                                                 onNestedStatChange,
                                                 rules,
                                                 onRulesChange,
                                                 legendaryTrackerEnabled,
                                                 rivalCensorEnabled,
                                                 onlegendaryIncrement,
                                                 runStartedAt,
                                             }) => {
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [draftRules, setDraftRules] = useState<string[]>(rules);
    const [showRivalCaps, setShowRivalCaps] = useState(false);

    const randomLegendary = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * LEGENDARY_POKEMON_NAMES.length);
        return LEGENDARY_POKEMON_NAMES[randomIndex];
    }, []);

    const nextRivalToRevealIndex = rivalCensorEnabled ? rivalCaps.findIndex(rc => !rc.revealed) : -1;

    const doneArenas = levelCaps.filter(c => c.done).length;
    const doneRivals = rivalCaps.filter(r => r.done).length;
    const totalMilestones = 10 + rivalCaps.length;
    const completedMilestones = Math.min(doneArenas + doneRivals, totalMilestones);
    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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
                                        <div className="flex items-center justify-center gap-3">
                                            <img
                                                src={getBadgeUrl(next.arena, Math.max(levelCaps.findIndex(c => c.id === next.id), 0))}
                                                alt={`${next.arena} Badge`}
                                                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                                                style={{imageRendering: 'inherit'}}/>
                                            <div className="flex flex-col items-center">
                                                <div>Als Nächstes: <strong>{next.arena}</strong></div>
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
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                                <span>Fortschritt</span>
                                <span className="font-semibold">{completedMilestones}/{totalMilestones} · {progressPct}%</span>
                            </div>
                            <div className="relative h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" aria-label="Fortschritt" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                                <div
                                    className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-[inset_0_0_6px_rgba(0,0,0,0.25)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                                <div className="absolute inset-0 [mask-image:radial-gradient(transparent,black)] opacity-20 pointer-events-none"></div>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                Arenen + Top 4 + Champ = 10 | Rivalenkämpfe = {rivalCaps.length}
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
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold"
                                    style={{color: PLAYER1_COLOR}}>{player1Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button type="button"
                                                onClick={() => onNestedStatChange('top4Items', 'player1', String(Math.max(0, (stats.top4Items.player1 || 0) - 1)))}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                aria-label="Items verringern" title="Items verringern"><FiMinus
                                            size={16}/></button>
                                        <input type="number" value={stats.top4Items.player1}
                                               onChange={(e) => onNestedStatChange('top4Items', 'player1', e.target.value)}
                                               className="w-16 text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"/>
                                        <button type="button"
                                                onClick={() => onNestedStatChange('top4Items', 'player1', String((stats.top4Items.player1 || 0) + 1))}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                aria-label="Items erhöhen" title="Items erhöhen"><FiPlus size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold"
                                    style={{color: PLAYER2_COLOR}}>{player2Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button type="button"
                                                onClick={() => onNestedStatChange('top4Items', 'player2', String(Math.max(0, (stats.top4Items.player2 || 0) - 1)))}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                aria-label="Items verringern" title="Items verringern"><FiMinus
                                            size={16}/></button>
                                        <input type="number" value={stats.top4Items.player2}
                                               onChange={(e) => onNestedStatChange('top4Items', 'player2', e.target.value)}
                                               className="w-16 text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"/>
                                        <button type="button"
                                                onClick={() => onNestedStatChange('top4Items', 'player2', String((stats.top4Items.player2 || 0) + 1))}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                aria-label="Items erhöhen" title="Items erhöhen"><FiPlus size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
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
                        <button onClick={() => setShowRivalCaps(prev => !prev)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25"
                                title="Ansicht wechseln">
                            <FiRefreshCw size={14}
                                         className={`transition-transform duration-500 ${showRivalCaps ? 'rotate-180' : ''}`}/>
                        </button>
                    </div>

                    <div className={`relative flex-grow transition-transform duration-700`}
                         style={{
                             transformStyle: 'preserve-3d',
                             transform: showRivalCaps ? 'rotateY(180deg)' : 'rotateY(0deg)'
                         }}>
                        <div className="absolute w-full h-full"
                             style={{
                                 backfaceVisibility: 'hidden',
                                 transform: 'rotateY(0deg)'
                             }}>
                            <div className="h-full overflow-y-auto">
                                <table className="w-full h-full flex flex-col">
                                    <tbody
                                        className="flex-grow flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                                    {levelCaps.map((cap, index) => (
                                        <tr key={cap.id}
                                            className={`flex flex-grow items-center ${cap.done ? 'bg-green-100 dark:bg-green-900/50' : ''}`}>
                                            <td className="px-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-left select-none w-[70%]">
                                                <div className="flex items-center gap-2">
                                                    <input id={`levelcap-done-${cap.id}`} type="checkbox"
                                                           checked={!!cap.done}
                                                           onChange={() => onLevelCapToggle(index)}
                                                           aria-label={`Erledigt: ${cap.arena}`}
                                                           className={`${!cap.done && !(index === 0 || levelCaps[index - 1]?.done)} h-4 w-4 accent-green-600`}/>
                                                    <label htmlFor={`levelcap-done-${cap.id}`}
                                                           className="px-0.75 cursor-pointer">{cap.arena}</label>
                                                </div>
                                            </td>
                                            <td>
                                                <img src={getBadgeUrl(cap.arena, index)} alt={`${cap.arena} Badge`}
                                                     className="w-8 h-8 object-contain"/>
                                            </td>
                                            <td className="text-right pl-2 pr-3">
                                                <span
                                                    className="font-bold text-lg text-gray-800 dark:text-gray-200">{cap.level}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="absolute w-full h-full"
                             style={{
                                 backfaceVisibility: 'hidden',
                                 transform: 'rotateY(180deg)'
                             }}>
                            <div className="p-2 h-full overflow-y-auto space-y-1 custom-scrollbar">
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
                                                className={`flex items-center justify-between px-2 py-1.5 border rounded-md ${rc.done ? 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                                    <input id={`rivalcap-done-${rc.id}`} type="checkbox"
                                                           checked={!!rc.done}
                                                           onChange={() => onRivalCapToggleDone(index)}
                                                           aria-label={`Erledigt: ${rc.rival}`}
                                                           className="h-5 w-5 accent-green-600 cursor-pointer flex-shrink-0"/>
                                                    <span
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-sm text-gray-800 dark:text-gray-300 break-words">{rc.location}</span>
                                                </div>
                                                <div className="flex items-center justify-end flex-shrink-0">
                                                    <RivalImage name={rc.rival}/>
                                                    <span
                                                        className="font-bold text-lg text-gray-800 dark:text-gray-200 w-10 text-center">{rc.level}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${legendaryTrackerEnabled ? 'md:grid-cols-2' : ''} gap-6`}>
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <h2 className="text-center p-2 bg-gray-800 dark:bg-gray-900 text-white font-press-start text-sm">Tode</h2>
                    <div className="grid grid-cols-2">
                        <div className="text-center border-r border-gray-300 dark:border-gray-700 p-2">
                            <h3 className="font-press-start text-xs" style={{color: PLAYER1_COLOR}}>{player1Name}</h3>
                            <div
                                className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 dark:text-gray-200">{stats.deaths.player1}</div>
                            <div
                                className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gesamt: {(stats.sumDeaths?.player1 ?? 0) + (stats.deaths.player1 ?? 0)}</div>
                        </div>
                        <div className="text-center p-2">
                            <h3 className="font-press-start text-xs" style={{color: PLAYER2_COLOR}}>{player2Name}</h3>
                            <div
                                className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 dark:text-gray-200">{stats.deaths.player2}</div>
                            <div
                                className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gesamt: {(stats.sumDeaths?.player2 ?? 0) + (stats.deaths.player2 ?? 0)}</div>
                        </div>
                    </div>
                </div>

                {legendaryTrackerEnabled && (
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300
                        dark:border-gray-700 overflow-hidden hover:bg-gray-100 active:bg-gray-200
                        dark:hover:bg-gray-700 dark:active:bg-gray-600 duration-200 cursor-pointer select-none"
                        onClick={onlegendaryIncrement}
                    >
                        <h2 className="text-center p-2 text-black font-press-start text-[13.5px]"
                            style={{backgroundColor: '#cfcfc3'}}>
                            Legendären begegnet
                        </h2>
                        <div className="p-3 flex items-center justify-center flex-grow">
                            <div className="flex items-center justify-center gap-2">
                                <img
                                    src={getSpriteUrlForGermanName(randomLegendary) || ""}
                                    alt=""
                                    className="w-16 h-16"
                                />
                                <div className="text-3xl font-press-start text-gray-800 dark:text-gray-200">
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