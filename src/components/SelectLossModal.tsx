import React, { useEffect, useState } from 'react';
import type { PokemonPair } from '@/types';

interface SelectLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (player: 'player1' | 'player2') => void;
  pair: PokemonPair | null;
  player1Name: string;
  player2Name: string;
}

const SelectLossModal: React.FC<SelectLossModalProps> = ({ isOpen, onClose, onConfirm, pair, player1Name, player2Name }) => {
  const [selected, setSelected] = useState<'player1' | 'player2' | ''>('');

  useEffect(() => {
    if (isOpen) setSelected('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === '') return;
    onConfirm(selected as 'player1' | 'player2');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Wer hat das Pokémon getötet?</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Schließen">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {pair && (
          <div className="mb-4 text-sm text-gray-700">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{player1Name}</div>
                <div>{pair.player1.name || '—'}{pair.player1.nickname ? ` (${pair.player1.nickname})` : ''}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{player2Name}</div>
                <div>{pair.player2.name || '—'}{pair.player2.nickname ? ` (${pair.player2.nickname})` : ''}</div>
              </div>
            </div>
            {pair.route && (
              <div className="mt-2 text-xs text-gray-500">Gebiet: {pair.route}</div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lostPlayer"
                value="player1"
                checked={selected === 'player1'}
                onChange={() => setSelected('player1')}
                className="h-4 w-4 accent-red-600"
              />
              <span>{player1Name}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lostPlayer"
                value="player2"
                checked={selected === 'player2'}
                onChange={() => setSelected('player2')}
                className="h-4 w-4 accent-red-600"
              />
              <span>{player2Name}</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Abbrechen</button>
            <button
              type="submit"
              disabled={selected === ''}
              className={`px-4 py-2 rounded-md font-semibold shadow ${selected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Bestätigen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectLossModal;

