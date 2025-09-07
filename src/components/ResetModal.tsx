import React, { useState, useEffect } from 'react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'current' | 'all') => void;
}

const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [mode, setMode] = useState<'current' | 'all'>('current');

  useEffect(() => {
    if (isOpen) setMode('current');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Tracker zurücksetzen</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="reset-mode"
              checked={mode === 'current'}
              onChange={() => setMode('current')}
            />
            <div>
              <div className="font-medium">Aktuellen Run zurücksetzen</div>
              <div className="text-xs text-gray-600">Team, Box, Friedhof und Arenen-Status werden zurückgesetzt. Statistiken (Runs, Best) bleiben erhalten; Tode und Top 4 Items werden auf 0 gesetzt.</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="reset-mode"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            <div>
              <div className="font-medium">Alles zurücksetzen</div>
              <div className="text-xs text-gray-600">Gesamten Tracker inkl. Statistiken und Regeln zurücksetzen.</div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(mode)}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetModal;

