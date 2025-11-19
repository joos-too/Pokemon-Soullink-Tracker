import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FiPlus, FiX, FiUsers} from 'react-icons/fi';
import { GAME_VERSIONS } from '@/src/data/game-versions';
import { PLAYER_COLORS } from '@/constants';
import { focusRingClasses, focusRingInsetClasses, focusRingInputClasses } from '@/src/styles/focusRing';
import GameVersionPicker from './GameVersionPicker';
import { useTranslation } from 'react-i18next';
import {getLocalizedGameName} from "@/src/services/gameLocalization.ts";

interface CreateTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; playerNames: string[]; memberEmails: string[], gameVersionId: string; }) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const CreateTrackerModal: React.FC<CreateTrackerModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, error }) => {
  const [title, setTitle] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [memberInputs, setMemberInputs] = useState<string[]>(['']);
  const [gameVersionId, setGameVersionId] = useState('gen5_sw');
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const { t } = useTranslation();
  const playerCountLabels = useMemo(() => ({
    1: t('modals.createTracker.playerCounts.solo'),
    2: t('modals.createTracker.playerCounts.duo'),
    3: t('modals.createTracker.playerCounts.trio'),
  }), [t]);

  useEffect(() => {
    setPlayerNames((prev) => {
      const next = prev.slice(0, playerCount);
      while (next.length < playerCount) {
        next.push('');
      }
      return next;
    });
  }, [playerCount]);

  const resetForm = useCallback(() => {
    setTitle('');
    setPlayerCount(2);
    setPlayerNames(['', '']);
    setMemberInputs(['']);
    setGameVersionId('gen5_sw');
    setShowVersionPicker(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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
    const trimmedPlayerNames = playerNames.map((name) => name.trim());
    await onSubmit({
      title,
      playerNames: trimmedPlayerNames,
      memberEmails: memberInputs.map((entry) => entry.trim()).filter(Boolean),
      gameVersionId: gameVersionId,
    });
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
              <p className="text-xs uppercase tracking-[0.3em] text-green-600">{t('modals.createTracker.badge')}</p>
              <h2 className="text-xl font-semibold mt-1 text-gray-900 dark:text-gray-100">{t('modals.createTracker.title')}</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={`rounded-full p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${focusRingClasses}`}
              aria-label={t('common.close')}
              disabled={isSubmitting}
            >
              <FiX size={20} />
            </button>
          </header>

          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
                {t('modals.createTracker.versionLabel')}
              </label>
              <button
                type="button"
                onClick={() => setShowVersionPicker((v) => !v)}
                aria-expanded={showVersionPicker}
                aria-controls="game-version-picker-panel"
                className={`w-full inline-flex items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 ${focusRingClasses}`}
                title={t('modals.createTracker.versionButton')}
              >
                <span>{t('modals.createTracker.versionButton')}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                    {getLocalizedGameName(t, gameVersionId, GAME_VERSIONS[gameVersionId]?.name ?? gameVersionId)}</span>
              </button>

              <div
                id="game-version-picker-panel"
                aria-hidden={!showVersionPicker}
                inert={!showVersionPicker}
                className={`transform-gpu ${showVersionPicker ? 'mt-3 max-h-72 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} transition-all duration-300 ease-in-out overflow-hidden`}
              >
                <GameVersionPicker
                  value={gameVersionId}
                  isInteractive={showVersionPicker}
                  onSelect={(versionId) => {
                    setGameVersionId(versionId);
                    setShowVersionPicker(false)
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block" htmlFor="trackerTitle">
                {t('modals.createTracker.titleLabel')}
              </label>
              <input
                id="trackerTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder={t('modals.createTracker.titlePlaceholder')}
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t('modals.createTracker.playerCountLabel')}
                </label>
                <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:border-green-500 transition-colors">
                  {[1, 2, 3].map((count) => {
                    const active = playerCount === count;
                    return (
                      <button
                        key={`player-count-${count}`}
                        type="button"
                        onClick={() => setPlayerCount(count)}
                        className={`px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                          active
                            ? 'bg-green-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                        } ${count !== 3 ? 'border-r border-gray-300 dark:border-gray-600' : ''} ${focusRingInsetClasses}`}
                      >
                        {playerCountLabels[count as 1 | 2 | 3]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {playerNames.map((value, index) => {
                  const fullWidth = (playerNames.length === 3 && index === 2) || playerNames.length === 1;
                  return (
                    <div key={`player-name-${index}`} className={fullWidth ? 'sm:col-span-2' : undefined}>
                      <label
                        className="text-sm font-semibold mb-1 block"
                        style={{color: PLAYER_COLORS[index] ?? '#4b5563'}}
                      >
                        {t('modals.createTracker.playerLabel', { index: index + 1 })}
                      </label>
                      <input
                        type="text"
                        required
                        value={value}
                        onChange={(e) => setPlayerNames((prev) => prev.map((entry, i) => (i === index ? e.target.value : entry)))}
                        className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                        placeholder={t('modals.createTracker.playerPlaceholder')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FiUsers /> {t('modals.createTracker.membersLabel')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('modals.createTracker.membersDescription')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMemberRow}
                  className={`inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                >
                  <FiPlus /> {t('modals.createTracker.addMember')}
                </button>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto px-1 py-1 custom-scrollbar">
                {memberInputs.map((value, index) => (
                  <div key={`member-${index}`} className="flex gap-2">
                    <input
                      type="email"
                      value={value}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder="trainer@example.com"
                      className={`flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                    />
                    {memberInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(index)}
                        className={`rounded-md border border-gray-300 dark:border-gray-600 px-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${focusRingClasses}`}
                        aria-label={t('modals.createTracker.removeMember')}
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
              className={`inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 ${focusRingClasses}`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:opacity-60"
            >
              {isSubmitting ? t('modals.createTracker.submitting') : t('modals.createTracker.submit')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateTrackerModal;
