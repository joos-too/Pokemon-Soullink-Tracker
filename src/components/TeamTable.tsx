import React, {useMemo, useState} from 'react';
import type {PokemonPair} from '@/types';
import EditPairModal from './EditPairModal';
import {FiEdit, FiPlus, FiTrash, FiArrowUp, FiArrowDown} from "react-icons/fi";

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
    onAddPair: (payload: { route: string; p1Name: string; p1Nickname: string; p2Name: string; p2Nickname: string; }) => void;
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
                                                 variant = 'solid',
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
            .map((p, i) => ({ pair: p, originalIndex: i }))
            .filter(({ pair }) => (pair.player1?.name || pair.player2?.name || pair.route))
    ), [data]);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-300">
            <div className="px-3 pt-3 pb-2 flex justify-end">
                <button
                    type="button"
                    onClick={() => { if (!addDisabled) setAddOpen(true); }}
                    disabled={addDisabled}
                    className={(function(){
                        const base = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold shadow';
                        if (addDisabled) {
                            return variant === 'outline'
                                ? `${base} border border-gray-300 text-gray-400 bg-white cursor-not-allowed`
                                : `${base} bg-gray-300 text-gray-500 cursor-not-allowed`;
                        }
                        return variant === 'outline'
                            ? `${base} border border-green-600 text-green-700 bg-white hover:bg-green-50`
                            : `${base} bg-green-600 text-white hover:bg-green-700`;
                    })()}
                    title={addDisabled ? (addDisabledReason || 'Hinzufügen deaktiviert') : 'Paar hinzufügen'}
                    aria-label="Paar hinzufügen"
                    aria-disabled={addDisabled}
                >
                    <FiPlus size={18} /> Hinzufügen
                </button>
            </div>
            <table className="w-full border-collapse">
                <thead>
                <tr>
                    <HeaderCell color={color1} colSpan={3}>{title}</HeaderCell>
                    <HeaderCell color={color2} colSpan={2}>{title2}</HeaderCell>
                    <th className="p-2 bg-green-600 text-white font-press-start text-[10px] text-center">Gebiet</th>
                    <th className="p-2 bg-gray-700 text-white font-press-start text-[10px] text-center">Aktion</th>
                </tr>
                <tr>
                    <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">#</th>
                    <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Pokémon</th>
                    <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Spitzname</th>
                    <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Pokémon</th>
                    <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Spitzname</th>
                    <th className="p-1 border-t border-gray-300"></th>
                    <th className="p-1 border-t border-gray-300"></th>
                </tr>
                </thead>
                <tbody>
                {rows.length === 0 && (
                    <tr>
                        <td className="p-3 text-center text-sm text-gray-500" colSpan={7}>{emptyMessage}</td>
                    </tr>
                )}
                {rows.map(({ pair, originalIndex }, index) => (
                    <tr key={pair.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="p-2 text-center font-bold text-sm text-gray-800 border-r border-gray-200">{index + 1}</td>
                        <td className="p-2 text-center text-sm text-gray-800">{pair.player1.name || '-'}</td>
                        <td className="p-2 text-center text-sm text-gray-800 border-r border-gray-200">{pair.player1.nickname || '-'}</td>
                        <td className="p-2 text-center text-sm text-gray-800">{pair.player2.name || '-'}</td>
                        <td className="p-2 text-center text-sm text-gray-800 border-r border-gray-200">{pair.player2.nickname || '-'}</td>
                        <td className="p-2 text-center text-sm text-gray-800 border-r border-gray-200">{pair.route || '-'}</td>
                        <td className="p-2 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                                {/* Move between Team <-> Box */}
                                {context === 'team' ? (
                                    <button
                                        type="button"
                                        onClick={() => onMoveToBox(pair)}
                                        className="p-1 rounded-full hover:bg-gray-200 inline-flex items-center justify-center text-gray-700"
                                        title="In die Box verschieben"
                                        aria-label="In die Box verschieben"
                                    >
                                        <FiArrowDown size={18} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { if (!teamIsFull) onMoveToTeam(pair); }}
                                        disabled={teamIsFull}
                                        className={`p-1 rounded-full inline-flex items-center justify-center ${teamIsFull ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-700'}`}
                                        title={teamIsFull ? 'Team ist voll (max 6)' : 'Ins Team verschieben'}
                                        aria-label={teamIsFull ? 'Team ist voll (max 6)' : 'Ins Team verschieben'}
                                    >
                                        <FiArrowUp size={18} />
                                    </button>
                                )}
                                {/* Edit button */}
                                {(pair.player1.name || pair.player2.name || pair.route) && (
                                    <button
                                        type={"button"}
                                        onClick={() => setEditIndex(originalIndex)}
                                        className={`p-1 rounded-full hover:bg-gray-200 inline-flex items-center justify-center text-gray-700`}
                                        title={'Bearbeiten'}
                                    >
                                        <FiEdit size={20}/>
                                    </button>
                                )}
                                {/* Graveyard (only in team) */}
                                {context === 'team' && (pair.player1.name || pair.player2.name) && (
                                    <button
                                        type="button"
                                        onClick={() => onAddToGraveyard(pair)}
                                        className="p-1 rounded-full hover:bg-gray-200 inline-flex items-center justify-center text-red-600 hover:text-red-700"
                                        title="In den Friedhof verschieben"
                                        aria-label="In den Friedhof verschieben"
                                    >
                                        <FiTrash size={18}/>
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <EditPairModal
                isOpen={editIndex !== null}
                onClose={closeModal}
                onSave={handleSave}
                player1Label={player1Name}
                player2Label={player2Name}
                initial={editInitial || {route: '', p1Name: '', p1Nickname: '', p2Name: '', p2Nickname: ''}}
            />
            <EditPairModal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                onSave={(payload) => { onAddPair(payload); setAddOpen(false); }}
                player1Label={player1Name}
                player2Label={player2Name}
                initial={{route: '', p1Name: '', p1Nickname: '', p2Name: '', p2Nickname: ''}}
            />
        </div>
    );
};

export default TeamTable;
