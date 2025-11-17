import React, { useMemo } from 'react';
import type { PokemonLink } from '@/types';
import { getSpriteUrlForGermanName } from '@/src/services/sprites';
import { PLAYER_COLORS } from '@/constants';

interface GraveyardProps {
  graveyard?: PokemonLink[];
  playerNames: string[];
  playerColors?: string[];
  onManualAddClick?: () => void;
}

const Graveyard: React.FC<GraveyardProps> = ({ graveyard = [], playerNames, playerColors, onManualAddClick }) => {
  const names = useMemo(() => {
    const list = playerNames.length ? playerNames : ['Spieler 1'];
    return list.map((name, index) => (name?.trim().length ? name : `Spieler ${index + 1}`));
  }, [playerNames]);
  const colorForIndex = (index: number) => playerColors?.[index] ?? PLAYER_COLORS[index] ?? '#4b5563';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden custom-scrollbar">
      <div className="flex justify-center items-center p-2 bg-gray-800 dark:bg-gray-900">
        <h2 className="text-center text-white font-press-start text-sm">
          Tote / verlorene Pokémon
        </h2>
        {onManualAddClick && (
          <button 
            onClick={onManualAddClick} 
            className="ml-4 text-white hover:text-gray-300"
            title="Manually Add Lost Pair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4 max-h-96 overflow-y-auto">
        {graveyard && graveyard.length > 0 ? (
          <div className="space-y-3">
            {graveyard.map((pair) => (
              <div key={pair.id} className="p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-xs">
                <p className="text-center font-bold text-gray-600 dark:text-gray-300 mb-1">Gebiet: {pair.route || 'Unbekannte Route'}</p>
                <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${names.length}, minmax(0, 1fr))`}}>
                  {names.map((name, index) => {
                    const member = pair.members?.[index] ?? { name: '', nickname: '' };
                    const spriteUrl = getSpriteUrlForGermanName(member.name);
                    return (
                      <div key={`${pair.id}-player-${index}`}>
                        <p className="font-bold flex items-center gap-2" style={{color: colorForIndex(index)}}>
                          {spriteUrl ? (
                            <img src={spriteUrl} alt={member.name || 'Pokémon'} className="w-8 h-8" loading="lazy" style={{ imageRendering: 'pixelated' }}/>
                          ) : null}
                          <span>{name}'s {member.name || 'Pokémon'}</span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-400">Spitzname: {member.nickname || 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Noch keine tote/verlorene Pokémon.</p>
        )}
      </div>
    </div>
  );
};

export default Graveyard;
