import React, { useState } from 'react';
import type {LevelCap, Stats} from '@/types';
import EditableCell from './EditableCell';
import {PLAYER1_COLOR, PLAYER2_COLOR} from '@/constants';
import {FiMinus, FiPlus, FiEdit, FiX, FiSave} from 'react-icons/fi';

interface InfoPanelProps {
    player1Name: string;
    player2Name: string;
    levelCaps: LevelCap[];
    stats: Stats;
    onLevelCapChange: (index: number, value: string) => void;
    onLevelCapToggle: (index: number) => void;
    onStatChange: (stat: keyof Stats, value: string) => void;
    onNestedStatChange: (group: keyof Stats, key: string, value: string) => void;
    rules: string[];
    onRulesChange: (rules: string[]) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
                                                 player1Name,
                                                 player2Name,
                                                 levelCaps,
                                                 stats,
                                                 onLevelCapChange,
                                                 onLevelCapToggle,
                                                 onNestedStatChange,
                                                 rules,
                                                 onRulesChange
                                             }) => {
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [draftRules, setDraftRules] = useState<string[]>(rules);

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
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-blue-600 text-white font-press-start text-[10px]">Aktueller Level Cap</h2>
                        <div className="p-3 text-xl text-gray-800 dark:text-gray-200 text-center">
                            {(() => {
                                const next = levelCaps.find((c) => !c.done);
                                if (!next) return <span>Challenge geschafft!</span>;
                                return <span>Als Nächstes: <strong>{next.arena}</strong><br/>Level Cap: <strong>{next.level}</strong></span>;
                            })()}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-black text-white font-press-start text-[10px]">Run Stats</h2>
                        <table className="w-full">
                            <tbody>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">Run</td>
                                <td className="px-2 py-1.5 text-right"><span className="inline-block min-w-[2ch] text-sm font-bold">{stats.runs}</span></td>
                            </tr>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-300">Best</td>
                                <td className="px-2 py-1.5 text-right"><span className="inline-block min-w-[2ch] text-sm font-bold">{stats.best}</span></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <h2 className="text-center p-2 bg-black text-white font-press-start text-[10px]">Top 4 Items</h2>
                        <table className="w-full">
                            <tbody>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold" style={{color: PLAYER1_COLOR}}>{player1Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button type="button" onClick={() => onNestedStatChange('top4Items', 'player1', String(Math.max(0, (stats.top4Items.player1 || 0) - 1)))} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" aria-label="Items verringern" title="Items verringern"><FiMinus size={16}/></button>
                                        <input type="number" value={stats.top4Items.player1} onChange={(e) => onNestedStatChange('top4Items', 'player1', e.target.value)} className="w-16 text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"/>
                                        <button type="button" onClick={() => onNestedStatChange('top4Items', 'player1', String((stats.top4Items.player1 || 0) + 1))} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" aria-label="Items erhöhen" title="Items erhöhen"><FiPlus size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-2 py-1.5 text-xs font-bold" style={{color: PLAYER2_COLOR}}>{player2Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button type="button" onClick={() => onNestedStatChange('top4Items', 'player2', String(Math.max(0, (stats.top4Items.player2 || 0) - 1)))} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" aria-label="Items verringern" title="Items verringern"><FiMinus size={16}/></button>
                                        <input type="number" value={stats.top4Items.player2} onChange={(e) => onNestedStatChange('top4Items', 'player2', e.target.value)} className="w-16 text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"/>
                                        <button type="button" onClick={() => onNestedStatChange('top4Items', 'player2', String((stats.top4Items.player2 || 0) + 1))} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" aria-label="Items erhöhen" title="Items erhöhen"><FiPlus size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <h2 className="text-center p-2 text-white font-press-start text-[10px]" style={{backgroundColor: '#cf5930'}}>Level Caps</h2>
                    <table className="w-full">
                        <tbody>
                        {levelCaps.map((cap, index) => (
                            <tr key={cap.id} className={`border-t border-gray-200 dark:border-gray-700 ${cap.done ? 'bg-green-100 dark:bg-green-900/50' : ''}`}>
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-300 text-left select-none w-[70%]">
                                    <div className="flex items-center gap-2">
                                        <input id={`levelcap-done-${cap.id}`} type="checkbox" checked={!!cap.done} onChange={() => onLevelCapToggle(index)} aria-label={`Erledigt: ${cap.arena}`} className="h-4 w-4 accent-green-600 cursor-pointer"/>
                                        <label htmlFor={`levelcap-done-${cap.id}`} className="cursor-pointer">{cap.arena}</label>
                                    </div>
                                </td>
                                <EditableCell value={cap.level} onChange={(val) => onLevelCapChange(index, val)} className="text-right w-[30%]" isBold/>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                <h2 className="text-center p-2 bg-black text-white font-press-start text-sm">Tode</h2>
                <div className="grid grid-cols-2">
                    <div className="text-center border-r border-gray-300 dark:border-gray-700 p-2">
                        <h3 className="font-press-start text-xs" style={{color: PLAYER1_COLOR}}>{player1Name}</h3>
                        <div className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 dark:text-gray-200">{stats.deaths.player1}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gesamt: {(stats.sumDeaths?.player1 ?? 0) + (stats.deaths.player1 ?? 0)}</div>
                    </div>
                    <div className="text-center p-2">
                        <h3 className="font-press-start text-xs" style={{color: PLAYER2_COLOR}}>{player2Name}</h3>
                        <div className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 dark:text-gray-200">{stats.deaths.player2}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gesamt: {(stats.sumDeaths?.player2 ?? 0) + (stats.deaths.player2 ?? 0)}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
                <div className="relative">
                    <h2 className="text-center p-2 text-white font-press-start text-sm" style={{backgroundColor: '#34a853'}}>Regeln</h2>
                    <div className="absolute right-2 top-1.5 flex items-center gap-2">
                        {!isEditingRules ? (
                            <button type="button" onClick={startEditRules} className="px-2 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1 shadow" title="Regeln bearbeiten"><FiEdit size={14}/> Bearbeiten</button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={cancelEditRules} className="px-2 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1 shadow" title="Abbrechen"><FiX size={14}/> Abbrechen</button>
                                <button type="button" onClick={saveEditRules} className="px-2 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1 shadow" title="Speichern"><FiSave size={14}/> Speichern</button>
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
                                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 w-4 text-right">{index + 1}.</span>
                                <input type="text" value={rule} onChange={(e) => setDraftRules(prev => prev.map((r, i) => i === index ? e.target.value : r))} placeholder={`Regel ${index + 1}`} className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                            </div>
                        ))}
                        <div className="pt-2">
                            <button type="button" onClick={addNewRule} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" title="Neue Regel hinzufügen"><FiPlus size={14}/> Neue Regel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfoPanel;
