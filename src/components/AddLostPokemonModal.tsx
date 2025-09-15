import React, { useState, useEffect, useRef } from 'react';
import { searchGermanPokemonNames } from '@/src/services/pokemonSearch';
import { getSpriteUrlForGermanName } from '@/src/services/sprites';

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
  // Autocomplete state
  const [p1Suggestions, setP1Suggestions] = useState<string[]>([]);
  const [p2Suggestions, setP2Suggestions] = useState<string[]>([]);
  const [loadingP1, setLoadingP1] = useState(false);
  const [loadingP2, setLoadingP2] = useState(false);
  const [openP1, setOpenP1] = useState(false);
  const [openP2, setOpenP2] = useState(false);
  const [p1Focused, setP1Focused] = useState(false);
  const [p2Focused, setP2Focused] = useState(false);
  const [p1Active, setP1Active] = useState<number>(-1);
  const [p2Active, setP2Active] = useState<number>(-1);
  const searchSeqP1 = useRef(0);
  const searchSeqP2 = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setRoute('');
      setP1Pokemon('');
      setP2Pokemon('');
      setP1Suggestions([]);
      setP2Suggestions([]);
      setOpenP1(false);
      setOpenP2(false);
      setP1Focused(false);
      setP2Focused(false);
      setP1Active(-1);
      setP2Active(-1);
    }
  }, [isOpen]);

  // Autocomplete effects
  useEffect(() => {
    if (!isOpen || !p1Focused) {
      setP1Suggestions([]);
      setLoadingP1(false);
      setOpenP1(false);
      setP1Active(-1);
      return;
    }
    const seq = ++searchSeqP1.current;
    const q = p1Pokemon.trim();
    if (q.length < 2) {
      setP1Suggestions([]);
      setLoadingP1(false);
      setP1Active(-1);
      setOpenP1(false);
      return;
    }
    setLoadingP1(true);
    const t = setTimeout(async () => {
      const res = await searchGermanPokemonNames(q, 10);
      if (seq === searchSeqP1.current) {
        setP1Suggestions(res);
        setLoadingP1(false);
        setOpenP1(true);
        setP1Active(res.length ? 0 : -1);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [p1Pokemon, isOpen, p1Focused]);

  useEffect(() => {
    if (!isOpen || !p2Focused) {
      setP2Suggestions([]);
      setLoadingP2(false);
      setOpenP2(false);
      setP2Active(-1);
      return;
    }
    const seq = ++searchSeqP2.current;
    const q = p2Pokemon.trim();
    if (q.length < 2) {
      setP2Suggestions([]);
      setLoadingP2(false);
      setP2Active(-1);
      setOpenP2(false);
      return;
    }
    setLoadingP2(true);
    const t = setTimeout(async () => {
      const res = await searchGermanPokemonNames(q, 10);
      if (seq === searchSeqP2.current) {
        setP2Suggestions(res);
        setLoadingP2(false);
        setOpenP2(true);
        setP2Active(res.length ? 0 : -1);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [p2Pokemon, isOpen, p2Focused]);

  const onKeyDownP1: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Tab') {
      setOpenP1(false);
      return; // allow natural tab navigation
    }
    if (!openP1 || loadingP1 || p1Suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = p1Active < 0 ? 0 : (p1Active + 1) % p1Suggestions.length;
      setP1Active(next);
      setOpenP1(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = p1Active < 0 ? p1Suggestions.length - 1 : (p1Active - 1 + p1Suggestions.length) % p1Suggestions.length;
      setP1Active(next);
      setOpenP1(true);
    } else if (e.key === 'Enter') {
      if (p1Active >= 0 && p1Active < p1Suggestions.length) {
        e.preventDefault();
        setP1Pokemon(p1Suggestions[p1Active]);
        setOpenP1(false);
      }
    } else if (e.key === 'Escape') {
      setOpenP1(false);
    }
  };

  const onKeyDownP2: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Tab') {
      setOpenP2(false);
      return; // allow natural tab navigation
    }
    if (!openP2 || loadingP2 || p2Suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = p2Active < 0 ? 0 : (p2Active + 1) % p2Suggestions.length;
      setP2Active(next);
      setOpenP2(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = p2Active < 0 ? p2Suggestions.length - 1 : (p2Active - 1 + p2Suggestions.length) % p2Suggestions.length;
      setP2Active(next);
      setOpenP2(true);
    } else if (e.key === 'Enter') {
      if (p2Active >= 0 && p2Active < p2Suggestions.length) {
        e.preventDefault();
        setP2Pokemon(p2Suggestions[p2Active]);
        setOpenP2(false);
      }
    } else if (e.key === 'Escape') {
      setOpenP2(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tRoute = route.trim();
    const tP1 = p1Pokemon.trim();
    const tP2 = p2Pokemon.trim();
    if (!tRoute || !tP1 || !tP2) return; // extra guard
    onAdd(tRoute, tP1, tP2);
  };

  const isValid = route.trim().length > 0 && p1Pokemon.trim().length > 0 && p2Pokemon.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">Verlorenen Seelenlink hinzufügen</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="route" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Gebiet <span className="text-red-500">*</span>
              </label>
              <input
                id="route"
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Route 1"
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="p1Pokemon" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                {player1Name}'s Pokémon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
              <input
                id="p1Pokemon"
                type="text"
                value={p1Pokemon}
                onChange={(e) => setP1Pokemon(e.target.value)}
                onFocus={() => setP1Focused(true)}
                onBlur={() => setTimeout(() => { setOpenP1(false); setP1Focused(false); }, 150)}
                onKeyDown={onKeyDownP1}
                className="w-full pr-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Rattfratz"
                required
                aria-autocomplete="list"
                aria-expanded={openP1}
              />
              {(() => { const url = getSpriteUrlForGermanName(p1Pokemon); return url ? (
                <img src={url} alt="" aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 pointer-events-none select-none" loading="lazy"/>
              ) : null; })()}
              </div>
              {openP1 && (loadingP1 || p1Suggestions.length > 0) && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  {loadingP1 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Lade Vorschläge...</div>
                  )}
                  {!loadingP1 && p1Suggestions.map((s, idx) => (
                    <div
                      key={s}
                      role="option"
                      aria-selected={idx === p1Active}
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setP1Pokemon(s); setOpenP1(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === p1Active ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
                    >
                      {s}
                    </div>
                  ))}
                  {!loadingP1 && p1Suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Treffer</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <label htmlFor="p2Pokemon" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                {player2Name}'s Pokémon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
              <input
                id="p2Pokemon"
                type="text"
                value={p2Pokemon}
                onChange={(e) => setP2Pokemon(e.target.value)}
                onFocus={() => setP2Focused(true)}
                onBlur={() => setTimeout(() => { setOpenP2(false); setP2Focused(false); }, 150)}
                onKeyDown={onKeyDownP2}
                className="w-full pr-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Taubsi"
                required
                aria-autocomplete="list"
                aria-expanded={openP2}
              />
              {(() => { const url = getSpriteUrlForGermanName(p2Pokemon); return url ? (
                <img src={url} alt="" aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 pointer-events-none select-none" loading="lazy"/>
              ) : null; })()}
              </div>
              {openP2 && (loadingP2 || p2Suggestions.length > 0) && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  {loadingP2 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Lade Vorschläge...</div>
                  )}
                  {!loadingP2 && p2Suggestions.map((s, idx) => (
                    <div
                      key={s}
                      role="option"
                      aria-selected={idx === p2Active}
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setP2Pokemon(s); setOpenP2(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === p2Active ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
                    >
                      {s}
                    </div>
                  ))}
                  {!loadingP2 && p2Suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Treffer</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={!isValid}
              className={`bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${isValid ? 'hover:bg-red-700' : 'opacity-50 cursor-not-allowed'}`}
              aria-disabled={!isValid}
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
