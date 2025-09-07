import React, { useState, useEffect } from 'react';

interface AddLostPokemonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (route: string, player1Name: string, player2Name: string) => void;
  player1Name: string;
  player2Name: string;
}

const AddLostPokemonModal: React.FC<AddLostPokemonModalProps> = ({ isOpen, onClose, onAdd, player1Name, player2Name }) => {
  const [route, setRoute] = useState('');
  const [p1Pokemon, setP1Pokemon] = useState('');
  const [p2Pokemon, setP2Pokemon] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoute('');
      setP1Pokemon('');
      setP2Pokemon('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(route, p1Pokemon, p2Pokemon);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Verlorene Pokemon hinzufügen</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="route" className="block text-sm font-bold text-gray-700 mb-1">
                Gebiet <span className="text-red-500">*</span>
              </label>
              <input
                id="route"
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Route 1"
                required
              />
            </div>
            <div>
              <label htmlFor="p1Pokemon" className="block text-sm font-bold text-gray-700 mb-1">
                {player1Name}'s Pokémon <span className="text-red-500">*</span>
              </label>
              <input
                id="p1Pokemon"
                type="text"
                value={p1Pokemon}
                onChange={(e) => setP1Pokemon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Rattfratz"
                required
              />
            </div>
            <div>
              <label htmlFor="p2Pokemon" className="block text-sm font-bold text-gray-700 mb-1">
                {player2Name}'s Pokémon <span className="text-red-500">*</span>
              </label>
              <input
                id="p2Pokemon"
                type="text"
                value={p2Pokemon}
                onChange={(e) => setP2Pokemon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Taubsi"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLostPokemonModal;