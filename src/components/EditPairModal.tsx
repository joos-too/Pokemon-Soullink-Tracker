import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (isOpen) {
      setRoute(initial.route || '');
      setP1Name(initial.p1Name || '');
      setP1Nickname(initial.p1Nickname || '');
      setP2Name(initial.p2Name || '');
      setP2Nickname(initial.p2Nickname || '');
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

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
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{player1Label} – Pokémon <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Glumanda"
                required
              />
              <label className="block text-xs text-gray-600 dark:text-gray-400 mt-2">Spitzname</label>
              <input
                type="text"
                value={p1Nickname}
                onChange={(e) => setP1Nickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="optional"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{player2Label} – Pokémon <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. Schiggy"
                required
              />
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
