import React, {useEffect, useMemo, useRef, useState} from 'react';
import {searchPokemonNames} from '@/src/services/pokemonSearch';
import {getSpriteUrlForPokemonName} from '@/src/services/sprites';
import {focusRingClasses, focusRingInputClasses} from '@/src/styles/focusRing';
import type {Pokemon} from '@/types';
import {useTranslation} from 'react-i18next';
import {normalizeLanguage} from '@/src/utils/language';
import LocationSuggestionInput from '@/src/components/LocationSuggestionInput';

interface AddLostPokemonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (route: string, members: Pokemon[]) => void;
    playerNames: string[];
    generationLimit?: number;
}

interface PokemonNameFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    isOpen: boolean;
    generationLimit?: number;
}

const PokemonNameField: React.FC<PokemonNameFieldProps> = ({label, value, onChange, isOpen, generationLimit}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchSeq = useRef(0);
    const {t, i18n} = useTranslation();
    const language = useMemo(() => normalizeLanguage(i18n.language), [i18n.language]);

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
        const timer = setTimeout(async () => {
            const res = await searchPokemonNames(term, 10, {maxGeneration: generationLimit, locale: language});
            if (seq === searchSeq.current) {
                setSuggestions(res);
                setLoading(false);
                setOpen(res.length > 0);
                setActiveIndex(res.length ? 0 : -1);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [value, focused, isOpen, generationLimit, language]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (!open || loading || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            onChange(suggestions[activeIndex]);
            setOpen(false);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const spriteUrl = getSpriteUrlForPokemonName(value);

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => {
                        setFocused(false);
                        setOpen(false);
                    }, 150)}
                    onKeyDown={handleKeyDown}
                    className={`w-full pr-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                    placeholder={t('common.pokemonPlaceholder')}
                    required
                    aria-expanded={open}
                />
                {spriteUrl ? (
                    <img src={spriteUrl} alt="" aria-hidden="true"
                         className="pointer-events-none absolute inset-y-0 right-2 my-auto h-8 w-8 select-none"
                         loading="lazy"/>
                ) : null}
                {open && suggestions.length > 0 && (
                    <div
                        className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                        {loading && (
                            <div
                                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{t('modals.common.loadingSuggestions')}</div>
                        )}
                        {!loading && suggestions.map((s, idx) => (
                            <div
                                key={s}
                                role="option"
                                aria-selected={idx === activeIndex}
                                tabIndex={-1}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(s);
                                    setOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === activeIndex ? 'bg-indigo-100 dark:bg-gray-700' : ''}`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const AddLostPokemonModal: React.FC<AddLostPokemonModalProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     onAdd,
                                                                     playerNames,
                                                                     generationLimit
                                                                 }) => {
    const {t} = useTranslation();
    const [route, setRoute] = useState('');
    const [pokemonNames, setPokemonNames] = useState<string[]>(() => playerNames.map(() => ''));

    useEffect(() => {
        if (isOpen) {
            setRoute('');
            setPokemonNames(playerNames.map(() => ''));
        }
    }, [isOpen, playerNames]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedRoute = route.trim();
        const trimmedNames = pokemonNames.map((name) => name.trim());
        if (!trimmedRoute || trimmedNames.some(name => name.length === 0)) return;
        const members: Pokemon[] = trimmedNames.map((name) => ({name, nickname: ''}));
        onAdd(trimmedRoute, members);
    };

    const isValid = route.trim().length > 0 && pokemonNames.every((name) => name.trim().length > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-gray-100">{t('modals.addLost.title')}</h2>
                    <button onClick={onClose}
                            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <LocationSuggestionInput
                                label={t('modals.addLost.routeLabel')}
                                value={route}
                                onChange={setRoute}
                                isOpen={isOpen}
                                generationLimit={generationLimit}
                            />
                        </div>
                        {playerNames.map((name, index) => (
                            <PokemonNameField
                                key={`lost-field-${index}`}
                                label={t('modals.addLost.playerPokemonLabel', {name})}
                                value={pokemonNames[index] ?? ''}
                                onChange={(value) => setPokemonNames(prev => {
                                    const next = [...prev];
                                    next[index] = value;
                                    return next;
                                })}
                                isOpen={isOpen}
                                generationLimit={generationLimit}
                            />
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={onClose}
                                className={`px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}>{t('common.cancel')}</button>
                        <button type="submit" disabled={!isValid}
                                className={`px-4 py-2 rounded-md font-semibold shadow ${isValid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'} ${focusRingClasses}`}>
                            {t('common.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLostPokemonModal;
