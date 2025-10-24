import React from 'react';
import type { PokemonPair } from '@/types';
import { getSpriteUrlForGermanName } from '@/src/services/sprites';

interface GraveyardProps {
  graveyard?: PokemonPair[];
  player1Name?: string;
  player2Name?: string;
  onManualAddClick?: () => void;
}

const Graveyard: React.FC<GraveyardProps> = ({ graveyard = [], player1Name = 'Player 1', player2Name = 'Player 2', onManualAddClick }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-bold text-red-600 flex items-center gap-2">
                      {(() => {
                        const url = getSpriteUrlForGermanName(pair.player1.name);
                        return url ? <img src={url} alt={pair.player1.name || 'Pokémon'} className="w-8 h-8" loading="lazy" style={{ imageRendering: 'pixelated' }}/> : null;
                      })()}
                      <span>{player1Name}'s {pair.player1.name || 'Pokémon'}</span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-400">Spitzname: {pair.player1.nickname || 'N/A'}</p>
                  </div>
                   <div>
                    <p className="font-bold text-purple-700 flex items-center gap-2">
                      {(() => {
                        const url = getSpriteUrlForGermanName(pair.player2.name);
                        return url ? <img src={url} alt={pair.player2.name || 'Pokémon'} className="w-8 h-8" loading="lazy" style={{ imageRendering: 'pixelated' }}/> : null;
                      })()}
                      <span>{player2Name}'s {pair.player2.name || 'Pokémon'}</span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-400">Spitzname: {pair.player2.nickname || 'N/A'}</p>
                  </div>
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
