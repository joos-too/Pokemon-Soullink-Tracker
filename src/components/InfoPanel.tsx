import React from 'react';
import type {LevelCap, Stats} from '@/types';
import EditableCell from './EditableCell';
import {PLAYER1_COLOR, PLAYER2_COLOR} from '@/constants';
import {FiMinus, FiPlus} from 'react-icons/fi';

interface InfoPanelProps {
    player1Name: string;
    player2Name: string;
    levelCaps: LevelCap[];
    stats: Stats;
    onLevelCapChange: (index: number, value: string) => void;
    onLevelCapToggle: (index: number) => void;
    onStatChange: (stat: keyof Stats, value: string) => void;
    onNestedStatChange: (group: keyof Stats, key: string, value: string) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
                                                 player1Name,
                                                 player2Name,
                                                 levelCaps,
                                                 stats,
                                                 onLevelCapChange,
                                                 onLevelCapToggle,
                                                 onNestedStatChange
                                             }) => {
    const rules = [
        "Pro Route/Gebiet darf nur das erste Pokemon gefangen werden.",
        "Besiegte Pokemon gelten als verstorben und müssen in eine Grab-Box.",
        "Jedes Pokemon erhält einen Spitznamen, den der Seelenpartner auswählt.",
        "Pokemon, Items, und Trainer sind gerandomized.",
        "Das Level des stärksten Pokemons des Arenaleiters darf nicht überschritten werden.",
        "Kampffolge wird auf 'Folgen' gestellt.",
        "Gegenstände im Kampf nur, wenn der Gegner auch einen verwendet.",
        "Shiny Pokemon dürfen immer gefangen und ausgetauscht werden.",
        "Challenge verloren, wenn das komplette Team eines Spielers besiegt wurde."
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-300">
                <h2 className="text-center p-2 text-white font-press-start text-sm"
                    style={{backgroundColor: '#34a853'}}>Regeln</h2>
                <ul className="p-4 space-y-2 text-xs list-decimal list-inside text-gray-700">
                    {rules.map((rule, index) => <li key={index}>{rule}</li>)}
                </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                    <h2 className="text-center p-2 text-white font-press-start text-[10px]"
                        style={{backgroundColor: '#cf5930'}}>Level Caps</h2>
                    <table className="w-full">
                        <tbody>
                        {levelCaps.map((cap, index) => (
                            <tr
                                key={cap.id}
                                className={`border-t border-gray-200 ${cap.done ? 'bg-green-100' : ''}`}
                            >
                                <td
                                    className="px-2 py-1.5 text-xs font-bold text-gray-800 text-left cursor-pointer select-none"
                                    onClick={() => onLevelCapToggle(index)}
                                    title={cap.done ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
                                >
                                    {cap.arena}
                                </td>
                                <EditableCell value={cap.level} onChange={(val) => onLevelCapChange(index, val)}
                                              className="text-right" isBold/>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4">
                    {/* Current Level Cap indicator */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                        <h2 className="text-center p-2 bg-blue-600 text-white font-press-start text-[10px]">Aktueller
                            Level Cap</h2>
                        <div className="p-3 text-sm text-gray-800 text-center">
                            {(() => {
                                const next = levelCaps.find((c) => !c.done);
                                if (!next) {
                                    return <span>Challenge geschafft!</span>;
                                }
                                return (
                                    <span>
                                        Als Nächstes: <strong>{next.arena}</strong><br/>
                                        Level Cap: <strong>{next.level}</strong>
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                        <h2 className="text-center p-2 bg-black text-white font-press-start text-[10px]">Run Stats</h2>
                        <table className="w-full">
                            <tbody>
                            <tr className="border-t border-gray-200">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800">Run</td>
                                <td className="px-2 py-1.5 text-right">
                                    <span className="inline-block min-w-[2ch] text-sm font-bold">{stats.runs}</span>
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="px-2 py-1.5 text-xs font-bold text-gray-800">Best</td>
                                <td className="px-2 py-1.5 text-right">
                                    <span className="inline-block min-w-[2ch] text-sm font-bold">{stats.best}</span>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                        <h2 className="text-center p-2 bg-black text-white font-press-start text-[10px]">Top 4
                            Items</h2>
                        <table className="w-full">
                            <tbody>
                            <tr className="border-t border-gray-200">
                                <td className="px-2 py-1.5 text-xs font-bold"
                                    style={{color: PLAYER1_COLOR}}>{player1Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onNestedStatChange('top4Items', 'player1', String(Math.max(0, (stats.top4Items.player1 || 0) - 1)))}
                                            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                                            aria-label="Items verringern"
                                            title="Items verringern"
                                        >
                                            <FiMinus size={16}/>
                                        </button>
                                        <input
                                            type="number"
                                            value={stats.top4Items.player1}
                                            onChange={(e) => onNestedStatChange('top4Items', 'player1', e.target.value)}
                                            className="w-16 text-right bg-transparent border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onNestedStatChange('top4Items', 'player1', String((stats.top4Items.player1 || 0) + 1))}
                                            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                                            aria-label="Items erhöhen"
                                            title="Items erhöhen"
                                        >
                                            <FiPlus size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="px-2 py-1.5 text-xs font-bold"
                                    style={{color: PLAYER2_COLOR}}>{player2Name}</td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onNestedStatChange('top4Items', 'player2', String(Math.max(0, (stats.top4Items.player2 || 0) - 1)))}
                                            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                                            aria-label="Items verringern"
                                            title="Items verringern"
                                        >
                                            <FiMinus size={16}/>
                                        </button>
                                        <input
                                            type="number"
                                            value={stats.top4Items.player2}
                                            onChange={(e) => onNestedStatChange('top4Items', 'player2', e.target.value)}
                                            className="w-16 text-right bg-transparent border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onNestedStatChange('top4Items', 'player2', String((stats.top4Items.player2 || 0) + 1))}
                                            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                                            aria-label="Items erhöhen"
                                            title="Items erhöhen"
                                        >
                                            <FiPlus size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                <h2 className="text-center p-2 bg-black text-white font-press-start text-sm">Tode</h2>
                <div className="grid grid-cols-2">
                    <div className="text-center border-r border-gray-300 p-2">
                        <h3 className="font-press-start text-xs" style={{color: PLAYER1_COLOR}}>{player1Name}</h3>
                        <input
                            type="number"
                            value={stats.deaths.player1}
                            disabled
                            className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 cursor-not-allowed"
                        />
                    </div>
                    <div className="text-center p-2">
                        <h3 className="font-press-start text-xs" style={{color: PLAYER2_COLOR}}>{player2Name}</h3>
                        <input
                            type="number"
                            value={stats.deaths.player2}
                            disabled
                            className="text-4xl font-press-start text-center bg-transparent w-full outline-none mt-2 text-gray-800 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;
