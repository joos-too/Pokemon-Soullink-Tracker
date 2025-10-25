import React, {useMemo, useState} from 'react';
import type {PokemonPair} from '@/types';
import EditPairModal from './EditPairModal';
import SelectEvolveModal from './SelectEvolveModal';
import {FiEdit, FiPlus, FiTrash, FiArrowUp, FiArrowDown, FiChevronsUp} from "react-icons/fi";
import {getOfficialArtworkUrlForGermanName} from '@/src/services/sprites';

interface TeamTableProps {
    title: string;
    title2: string;
    color1: string;
    color2: string;
    data: PokemonPair[];
    onPokemonChange: (index: number, player: 'player1' | 'player2', field: string, value: string) => void;
    onRouteChange: (index: number, value: string) => void;
    onAddToGraveyard: (pair: PokemonPair) => void;
    player1Name?: string;
    player2Name?: string;
    onAddPair: (payload: {
        route: string;
        p1Name: string;
        p1Nickname: string;
        p2Name: string;
        p2Nickname: string;
    }) => void;
    emptyMessage: string;
    addDisabled?: boolean;
    addDisabledReason?: string;
    variant?: 'solid' | 'outline';
    context: 'team' | 'box';
    onMoveToTeam: (pair: PokemonPair) => void;
    onMoveToBox: (pair: PokemonPair) => void;
    teamIsFull?: boolean;
}

const TeamTable: React.FC<TeamTableProps> = ({
                                                 title,
                                                 title2,
                                                 color1,
                                                 color2,
                                                 data,
                                                 onPokemonChange,
                                                 onRouteChange,
                                                 onAddToGraveyard,
                                                 player1Name = 'Player 1',
                                                 player2Name = 'Player 2',
                                                 onAddPair,
                                                 emptyMessage,
                                                 addDisabled = false,
                                                 addDisabledReason,
                                                 context,
                                                 onMoveToTeam,
                                                 onMoveToBox,
                                                 teamIsFull = false
                                             }) => {
    const HeaderCell: React.FC<{
        children: React.ReactNode;
        className?: string;
        color?: string;
        colSpan?: number
    }> = ({children, className = '', color, colSpan}) => (
        <th className={`p-2 font-press-start text-[10px] text-white whitespace-nowrap ${className}`}
            style={{backgroundColor: color}} colSpan={colSpan}>
            {children}
        </th>
    );

    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [evolveIndex, setEvolveIndex] = useState<number | null>(null);

    const closeModal = () => setEditIndex(null);

    const handleSave = (payload: {
        route: string;
        p1Name: string;
        p1Nickname: string;
        p2Name: string;
        p2Nickname: string;
    }) => {
        if (editIndex === null) return;
        onPokemonChange(editIndex, 'player1', 'name', payload.p1Name);
        onPokemonChange(editIndex, 'player1', 'nickname', payload.p1Nickname);
        onPokemonChange(editIndex, 'player2', 'name', payload.p2Name);
        onPokemonChange(editIndex, 'player2', 'nickname', payload.p2Nickname);
        onRouteChange(editIndex, payload.route);
        closeModal();
    };

    const editInitial = useMemo(() => {
        if (editIndex === null) return null;
        const p = data[editIndex];
        return {
            route: p?.route || '',
            p1Name: p?.player1?.name || '',
            p1Nickname: p?.player1?.nickname || '',
            p2Name: p?.player2?.name || '',
            p2Nickname: p?.player2?.nickname || '',
        };
    }, [editIndex, data]);

    const rows = useMemo(() => (
        data
            .map((p, i) => ({pair: p, originalIndex: i}))
            .filter(({pair}) => (pair.player1?.name || pair.player2?.name || pair.route))
    ), [data]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
            <div className="px-3 pt-3 pb-2 flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        if (!addDisabled) setAddOpen(true);
                    }}
                    disabled={addDisabled}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold shadow ${
                        addDisabled
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500'
                    }`}
                    title={addDisabled ? (addDisabledReason || 'Hinzufügen deaktiviert') : 'Paar hinzufügen'}
                    aria-label="Paar hinzufügen"
                    aria-disabled={addDisabled}
                >
                    <FiPlus size={18}/> Hinzufügen
                </button>
            </div>
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                    <thead>
                    <tr>
                        <HeaderCell color={color1} colSpan={4}>{title}</HeaderCell>
                        <HeaderCell color={color2} colSpan={3}>{title2}</HeaderCell>
                        <th className="p-2 bg-green-600 text-white font-press-start text-[10px] text-center">Gebiet</th>
                        <th className="p-2 bg-gray-700 dark:bg-gray-600 text-white font-press-start text-[10px] text-center">Aktion</th>
                    </tr>
                    <tr>
                        <th className="p-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700">#</th>
                        <th className="py-2 pl-2 pr-1 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700"></th>
                        <th className="py-2 pl-1 pr-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700">Pokémon</th>
                        <th className="py-2 px-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700">Spitzname</th>
                        <th className="py-2 pl-2 pr-1 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700"></th>
                        <th className="py-2 pl-1 pr-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700">Pokémon</th>
                        <th className="py-2 px-2 text-xs font-bold text-gray-800 dark:text-gray-300 text-center border-t border-gray-300 dark:border-gray-700">Spitzname</th>
                        <th className="p-1 border-t border-gray-300 dark:border-gray-700"></th>
                        <th className="p-1 border-t border-gray-300 dark:border-gray-700"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td className="p-3 text-center text-sm text-gray-500 dark:text-gray-400"
                                colSpan={9}>{emptyMessage}</td>
                        </tr>
                    )}
                    {rows.map(({pair, originalIndex}, index) => (
                        <tr key={pair.id}
                            className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-2 text-center font-bold text-sm text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">{index + 1}</td>
                            <td className="py-2 pl-2 pr-1 text-center">
                                {pair.player1.name ? (() => {
                                    const url = getOfficialArtworkUrlForGermanName(pair.player1.name);
                                    return url ? <img src={url} alt="" className="w-20 h-20"
                                                      loading="lazy"/> : null;
                                })() : null}
                            </td>
                            <td className="py-2 pl-1 pr-2 text-center text-sm text-gray-800 dark:text-gray-300">{pair.player1.name || '-'}</td>
                            <td className="py-2 px-2 text-center text-sm text-gray-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">{pair.player1.nickname || '-'}</td>
                            <td className="py-2 pl-2 pr-1 text-center">
                                {pair.player2.name ? (() => {
                                    const url = getOfficialArtworkUrlForGermanName(pair.player2.name);
                                    return url ? <img src={url} alt="" className="w-20 h-20"
                                                      loading="lazy"/> : null;
                                })() : null}
                            </td>
                            <td className="py-2 pl-1 pr-2 text-center text-sm text-gray-800 dark:text-gray-300">{pair.player2.name || '-'}</td>
                            <td className="py-2 px-2 text-center text-sm text-gray-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">{pair.player2.nickname || '-'}</td>
                            <td className="p-2 text-center text-sm text-gray-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">{pair.route || '-'}</td>
                            <td className="p-2 text-center w-40">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                    {/* Edit button */}
                                    {(pair.player1.name || pair.player2.name || pair.route) && (
                                        <button
                                            type={"button"}
                                            onClick={() => setEditIndex(originalIndex)}
                                            className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center justify-center text-gray-700 dark:text-gray-300`}
                                            title={'Bearbeiten'}
                                        >
                                            <FiEdit size={20}/>
                                        </button>
                                    )}
                                    {/* Move between Team <-> Box */}
                                    {context === 'team' ? (
                                        <button
                                            type="button"
                                            onClick={() => onMoveToBox(pair)}
                                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center justify-center text-gray-700 dark:text-gray-300"
                                            title="In die Box verschieben"
                                            aria-label="In die Box verschieben"
                                        >
                                            <FiArrowDown size={18}/>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!teamIsFull) onMoveToTeam(pair);
                                            }}
                                            disabled={teamIsFull}
                                            className={`p-1 rounded-full inline-flex items-center justify-center ${teamIsFull ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                                            title={teamIsFull ? 'Team ist voll (max 6)' : 'Ins Team verschieben'}
                                            aria-label={teamIsFull ? 'Team ist voll (max 6)' : 'Ins Team verschieben'}
                                        >
                                            <FiArrowUp size={18}/>
                                        </button>
                                    )}
                                    {/* Graveyard (only in team) */}
                                    {context === 'team' && (pair.player1.name || pair.player2.name) && (
                                        <>
                                            {/* Evolve button (no functionality yet) */}
                                            <button
                                                type="button"
                                                onClick={() => setEvolveIndex(originalIndex)}
                                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center justify-center text-gray-700 dark:text-gray-300"
                                                title="Entwickeln"
                                                aria-label="Entwickeln"
                                            >
                                                <FiChevronsUp size={18}/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onAddToGraveyard(pair)}
                                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center justify-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                                                title="In den Friedhof verschieben"
                                                aria-label="In den Friedhof verschieben"
                                            >
                                                <FiTrash size={18}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <EditPairModal
                isOpen={editIndex !== null}
                onClose={closeModal}
                onSave={handleSave}
                player1Label={player1Name}
                player2Label={player2Name}
                mode="edit"
                initial={editInitial || {route: '', p1Name: '', p1Nickname: '', p2Name: '', p2Nickname: ''}}
            />
            <SelectEvolveModal
                isOpen={evolveIndex !== null}
                onClose={() => setEvolveIndex(null)}
                onConfirm={(player, newName) => {
                    if (evolveIndex === null) return;
                    onPokemonChange(evolveIndex, player, 'name', newName);
                    setEvolveIndex(null);
                }}
                pair={evolveIndex !== null ? data[evolveIndex] : null}
                player1Label={player1Name}
                player2Label={player2Name}
            />
            <EditPairModal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                onSave={(payload) => {
                    onAddPair(payload);
                    setAddOpen(false);
                }}
                player1Label={player1Name}
                player2Label={player2Name}
                mode="create"
                initial={{route: '', p1Name: '', p1Nickname: '', p2Name: '', p2Nickname: ''}}
            />
        </div>
    );
};

export default TeamTable;
