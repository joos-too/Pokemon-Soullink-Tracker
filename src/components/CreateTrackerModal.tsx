import React, {useState} from 'react';
import {FiPlus, FiX, FiUsers} from 'react-icons/fi';
import { GAME_VERSIONS } from '@/src/data/game-versions';

interface CreateTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; player1Name: string; player2Name: string; memberEmails: string[], gameVersionId: string; }) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const CreateTrackerModal: React.FC<CreateTrackerModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, error }) => {
  const [title, setTitle] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [memberInputs, setMemberInputs] = useState<string[]>(['']);
  const [gameVersionId, setGameVersionId] = useState('gen5_bw');

  if (!isOpen) return null;

  const handleAddMemberRow = () => setMemberInputs((prev) => [...prev, '']);

  const handleRemoveMemberRow = (index: number) => {
    setMemberInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, value: string) => {
    setMemberInputs((prev) => prev.map((entry, i) => (i === index ? value : entry)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      title,
      player1Name,
      player2Name,
      memberEmails: memberInputs.map((entry) => entry.trim()).filter(Boolean),
      gameVersionId: gameVersionId,
    });
  };

  const resetForm = () => {
    setTitle('');
    setPlayer1Name('');
    setPlayer2Name('');
    setMemberInputs(['']);
    setGameVersionId('gen5_bw');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-600">Neuer Tracker</p>
              <h2 className="text-xl font-semibold mt-1 text-gray-900 dark:text-gray-100">Erstelle deine Session</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Schließen"
              disabled={isSubmitting}
            >
              <FiX size={20} />
            </button>
          </header>

          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block" htmlFor="gameVersion">
                Spielversion
              </label>
              <select
                id="gameVersion"
                value={gameVersionId}
                onChange={(e) => setGameVersionId(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Object.values(GAME_VERSIONS).map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block" htmlFor="trackerTitle">
                Titel
              </label>
              <input
                id="trackerTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="z. B. Schwarz 2 Randomizer"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Spieler 1</label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Spieler 2</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Name"
                />
              </div>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FiUsers /> Mitglieder (optional)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Füge Emails hinzu, die auf diesen Tracker zugreifen dürfen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMemberRow}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiPlus /> E-Mail
                </button>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto px-1 py-1">
                {memberInputs.map((value, index) => (
                  <div key={`member-${index}`} className="flex gap-2">
                    <input
                      type="email"
                      value={value}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder="trainer@example.com"
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {memberInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(index)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 px-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        aria-label="E-Mail entfernen"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}
          </div>

          <footer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-gray-200 dark:border-gray-700 px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:opacity-60"
            >
              {isSubmitting ? 'Erstelle…' : 'Tracker erstellen'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateTrackerModal;
