import React from 'react';
import type { PokemonPair } from '@/types';
import EditableCell from './EditableCell';

interface TeamTableProps {
  title: string;
  title2: string;
  player1Name: string;
  player2Name: string;
  color1: string;
  color2: string;
  data: PokemonPair[];
  onPokemonChange: (index: number, player: 'player1' | 'player2', field: string, value: string) => void;
  onRouteChange: (index: number, value: string) => void;
  onAddToGraveyard: (pair: PokemonPair) => void;
  isTeam?: boolean;
}

const TeamTable: React.FC<TeamTableProps> = ({ title, title2, player1Name, player2Name, color1, color2, data, onPokemonChange, onRouteChange, onAddToGraveyard, isTeam = false }) => {
  const HeaderCell: React.FC<{ children: React.ReactNode; className?: string; color?: string; colSpan?: number }> = ({ children, className = '', color, colSpan }) => (
    <th className={`p-2 font-press-start text-[10px] text-white whitespace-nowrap ${className}`} style={{ backgroundColor: color }} colSpan={colSpan}>
      {children}
    </th>
  );
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-300">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <HeaderCell color={color1} colSpan={5}>{title}</HeaderCell>
            <HeaderCell color={color2} colSpan={4}>{title2}</HeaderCell>
            <th className="p-2 bg-green-600 text-white font-press-start text-[10px] text-center">Route</th>
            <th className="p-2 bg-gray-700"></th>
          </tr>
          <tr>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">#</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Pokemon</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Nickname</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300" colSpan={2}>Typ</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Pokemon</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300">Nickname</th>
            <th className="p-2 text-xs font-bold text-gray-800 text-center border-t border-gray-300" colSpan={2}>Typ</th>
            <th className="p-1 border-t border-gray-300"></th>
            <th className="p-1 border-t border-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((pair, index) => (
            <tr key={pair.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-2 text-center font-bold text-sm text-gray-800 border-r border-gray-200">{pair.id}</td>
              <EditableCell value={pair.player1.name} onChange={(val) => onPokemonChange(index, 'player1', 'name', val)} />
              <EditableCell value={pair.player1.nickname} onChange={(val) => onPokemonChange(index, 'player1', 'nickname', val)} />
              <EditableCell value={pair.player1.type1} onChange={(val) => onPokemonChange(index, 'player1', 'type1', val)} />
              <EditableCell value={pair.player1.type2} onChange={(val) => onPokemonChange(index, 'player1', 'type2', val)} className="border-r border-gray-200" />
              <EditableCell value={pair.player2.name} onChange={(val) => onPokemonChange(index, 'player2', 'name', val)} />
              <EditableCell value={pair.player2.nickname} onChange={(val) => onPokemonChange(index, 'player2', 'nickname', val)} />
              <EditableCell value={pair.player2.type1} onChange={(val) => onPokemonChange(index, 'player2', 'type1', val)} />
              <EditableCell value={pair.player2.type2} onChange={(val) => onPokemonChange(index, 'player2', 'type2', val)} className="border-r border-gray-200" />
              <EditableCell value={pair.route} onChange={(val) => onRouteChange(index, val)} className="border-r border-gray-200" />
              <td className="p-1 text-center">
                 {(pair.player1.name || pair.player2.name) && (
                    <button 
                      onClick={() => onAddToGraveyard(pair)}
                      className="text-red-500 hover:text-red-700"
                      title="Move to Graveyard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                 )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamTable;