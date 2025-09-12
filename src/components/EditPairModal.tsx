import React, { useEffect, useRef, useState } from 'react';
import { searchGermanPokemonNames } from '@/src/services/pokemonSearch';

interface EditPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    route: string;
    p1Name: string;
    p1Nickname: string;
    p2Name: string;
    p2Nickname: string;
  }) => void;
  player1Label: string;
  player2Label: string;
  mode?: 'create' | 'edit';
  initial: {
    route: string;
    p1Name: string;
    p1Nickname: string;
    p2Name: string;
    p2Nickname: string;
  };
}

const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  onClose,
  onSave,
  player1Label,
  player2Label,
  initial,
  mode = 'edit',
}) => {
  const [route, setRoute] = useState(initial.route || '');
  const [p1Name, setP1Name] = useState(initial.p1Name || '');
  const [p1Nickname, setP1Nickname] = useState(initial.p1Nickname || '');
  const [p2Name, setP2Name] = useState(initial.p2Name || '');
  const [p2Nickname, setP2Nickname] = useState(initial.p2Nickname || '');

  // Autocomplete state for both inputs
  const [p1Suggestions, setP1Suggestions] = useState<string[]>([]);
  const [p2Suggestions, setP2Suggestions] = useState<string[]>([]);
  const [loadingP1, setLoadingP1] = useState(false);
  const [loadingP2, setLoadingP2] = useState(false);
  const [openP1, setOpenP1] = useState(false);
  const [openP2, setOpenP2] = useState(false);
  const [p1Active, setP1Active] = useState<number>(-1);
  const [p2Active, setP2Active] = useState<number>(-1);
  const searchSeqP1 = useRef(0);
  const searchSeqP2 = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setRoute(initial.route || '');
      setP1Name(initial.p1Name || '');
      setP1Nickname(initial.p1Nickname || '');
      setP2Name(initial.p2Name || '');
      setP2Nickname(initial.p2Nickname || '');
    }
  }, [isOpen, initial]);

  // do not early-return before hooks; guard inside effects instead

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tRoute = route.trim();
    const tP1 = p1Name.trim();
    const tP2 = p2Name.trim();
    if (!tRoute || !tP1 || !tP2) return; // extra guard
    onSave({
      route: tRoute,
      p1Name: tP1,
      p1Nickname: p1Nickname.trim(),
      p2Name: tP2,
      p2Nickname: p2Nickname.trim(),
    });
  };

  const isValid = route.trim().length > 0 && p1Name.trim().length > 0 && p2Name.trim().length > 0;
  const title = mode === 'create' ? 'Seelenlink hinzufügen' : 'Seelenlink bearbeiten';
  const cancelLabel = mode === 'create' ? 'Zurück' : 'Abbrechen';
  const submitLabel = mode === 'create' ? 'Hinzufügen' : 'Speichern';

  // Debounced search helpers
  useEffect(() => {
    if (!isOpen) {
      setP1Suggestions([]);
      setLoadingP1(false);
      setOpenP1(false);
      return;
    }
    const seq = ++searchSeqP1.current;
    const q = p1Name.trim();
    if (q.length < 2) {
      setP1Suggestions([]);
      setLoadingP1(false);
      setP1Active(-1);
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
  }, [p1Name, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setP2Suggestions([]);
      setLoadingP2(false);
      setOpenP2(false);
      return;
    }
    const seq = ++searchSeqP2.current;
    const q = p2Name.trim();
    if (q.length < 2) {
      setP2Suggestions([]);
      setLoadingP2(false);
      setP2Active(-1);
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
  }, [p2Name, isOpen]);

  const onKeyDownP1: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
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
        setP1Name(p1Suggestions[p1Active]);
        setOpenP1(false);
      }
    } else if (e.key === 'Escape') {
      setOpenP1(false);
    }
  };

  const onKeyDownP2: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
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
        setP2Name(p2Suggestions[p2Active]);
        setOpenP2(false);
      }
    } else if (e.key === 'Escape') {
      setOpenP2(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{player1Label} – Pokémon <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                onFocus={() => setOpenP1(true)}
                onBlur={() => setTimeout(() => setOpenP1(false), 150)}
                onKeyDown={onKeyDownP1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Glumanda"
                required
                aria-autocomplete="list"
                aria-expanded={openP1}
              />
              {openP1 && (loadingP1 || p1Suggestions.length > 0) && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  {loadingP1 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Lade Vorschläge...</div>
                  )}
                  {!loadingP1 && p1Suggestions.map((s, idx) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setP1Name(s); setOpenP1(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === p1Active ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                  {!loadingP1 && p1Suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Treffer</div>
                  )}
                </div>
              )}
              <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Spitzname</label>
              <input
                type="text"
                value={p1Nickname}
                onChange={(e) => setP1Nickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="optional"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{player2Label} – Pokémon <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                onFocus={() => setOpenP2(true)}
                onBlur={() => setTimeout(() => setOpenP2(false), 150)}
                onKeyDown={onKeyDownP2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Schiggy"
                required
                aria-autocomplete="list"
                aria-expanded={openP2}
              />
              {openP2 && (loadingP2 || p2Suggestions.length > 0) && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  {loadingP2 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Lade Vorschläge...</div>
                  )}
                  {!loadingP2 && p2Suggestions.map((s, idx) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setP2Name(s); setOpenP2(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === p2Active ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                  {!loadingP2 && p2Suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Treffer</div>
                  )}
                </div>
              )}
              <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Spitzname</label>
              <input
                type="text"
                value={p2Nickname}
                onChange={(e) => setP2Nickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="optional"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${isValid ? 'hover:bg-indigo-700' : 'opacity-50 cursor-not-allowed'}`}
              aria-disabled={!isValid}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPairModal;
