import React, { useEffect, useRef, useState } from 'react';
import type { Pokemon } from '@/types';
import { searchGermanPokemonNames } from '@/src/services/pokemonSearch';
import { getSpriteUrlForGermanName } from '@/src/services/sprites';
import { focusRingClasses } from '@/src/styles/focusRing';

interface EditPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    route: string;
    members: Pokemon[];
  }) => void;
  playerLabels: string[];
  mode?: 'create' | 'edit';
  initial: {
    route: string;
    members: Pokemon[];
  };
}

interface PokemonFieldProps {
  label: string;
  value: string;
  nickname: string;
  onNameChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  isOpen: boolean;
}

const PokemonField: React.FC<PokemonFieldProps> = ({ label, value, nickname, onNameChange, onNicknameChange, isOpen }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchSeq = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!focused) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    const seq = ++searchSeq.current;
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    setLoading(true);
    setOpen(true);
    const timer = setTimeout(async () => {
      const res = await searchGermanPokemonNames(term, 10);
      if (seq === searchSeq.current) {
        setSuggestions(res);
        setLoading(false);
        setOpen(true);
        setActiveIndex(res.length ? 0 : -1);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value, focused, isOpen]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (!open || loading || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onNameChange(suggestions[activeIndex]);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const spriteUrl = getSpriteUrlForGermanName(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
        {label} – Pokémon <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onNameChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setOpen(false); }, 150)}
          onKeyDown={handleKeyDown}
          className={`w-full pr-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingClasses}`}
          placeholder="Pokémon"
          required
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {spriteUrl ? (
          <img src={spriteUrl} alt="" aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 pointer-events-none select-none" loading="lazy" />
        ) : null}
        {open && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Lade Vorschläge...</div>
            )}
            {!loading && suggestions.map((s, idx) => (
              <div
                key={s}
                role="option"
                aria-selected={idx === activeIndex}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onNameChange(s); setOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === activeIndex ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
              >
                {s}
              </div>
            ))}
            {!loading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Keine Treffer</div>
            )}
          </div>
        )}
      </div>
      <label className="block text-xs text-gray-600 dark:text-gray-400">Spitzname <span className="text-red-500">*</span></label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingClasses}`}
        placeholder="Spitzname"
        required
      />
    </div>
  );
};

const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerLabels,
  initial,
  mode = 'edit',
}) => {
  const [route, setRoute] = useState(initial.route || '');
  const [members, setMembers] = useState<Pokemon[]>(() => playerLabels.map((_, index) => initial.members?.[index] ?? { name: '', nickname: '' }));

  useEffect(() => {
    if (isOpen) {
      setRoute(initial.route || '');
      setMembers(playerLabels.map((_, index) => initial.members?.[index] ?? { name: '', nickname: '' }));
    }
  }, [isOpen, initial, playerLabels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoute = route.trim();
    const trimmedMembers = playerLabels.map((_, index) => ({
      name: members[index]?.name.trim() ?? '',
      nickname: members[index]?.nickname.trim() ?? '',
    }));
    if (!trimmedRoute || trimmedMembers.some(member => member.name.length === 0 || member.nickname.length === 0)) {
      return;
    }
    onSave({
      route: trimmedRoute,
      members: trimmedMembers,
    });
  };

  const title = mode === 'create' ? 'Pokémon hinzufügen' : 'Pokémon bearbeiten';
  const cancelLabel = mode === 'create' ? 'Zurück' : 'Abbrechen';
  const submitLabel = mode === 'create' ? 'Hinzufügen' : 'Speichern';
  const isValid = route.trim().length > 0 && playerLabels.every((_, index) => {
    const member = members[index];
    return Boolean(member?.name.trim()) && Boolean(member?.nickname.trim());
  });
  const useTwoColumnLayout = playerLabels.length > 1;
  const gridClasses = useTwoColumnLayout ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}>
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
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingClasses}`}
              placeholder="z.B. Route 1"
              required
            />
          </div>

          <div className={gridClasses}>
            {playerLabels.map((label, index) => {
              const shouldStretchFullWidth = (playerLabels.length % 2 === 1 && index === playerLabels.length - 1);
              return (
                <div key={`player-field-${index}`} className={shouldStretchFullWidth && useTwoColumnLayout ? 'md:col-span-2' : undefined}>
                  <PokemonField
                    label={label}
                    value={members[index]?.name ?? ''}
                    nickname={members[index]?.nickname ?? ''}
                    onNameChange={(value) => setMembers(prev => {
                      const next = [...prev];
                      next[index] = { ...next[index], name: value };
                      return next;
                    })}
                    onNicknameChange={(value) => setMembers(prev => {
                      const next = [...prev];
                      next[index] = { ...next[index], nickname: value };
                      return next;
                    })}
                    isOpen={isOpen}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`px-4 py-2 rounded-md font-semibold shadow ${isValid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'} ${focusRingClasses}`}
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
