import React from 'react';
import {FiLogOut, FiPlus, FiUsers} from 'react-icons/fi';
import DarkModeToggle from '@/src/components/DarkModeToggle';
import type {TrackerMeta, TrackerSummary} from '@/types';
import GameVersionBadge from './GameVersionBadge';
import { focusRingClasses } from '@/src/styles/focusRing';

interface HomePageProps {
    trackers: TrackerMeta[];
    onOpenTracker: (trackerId: string) => void;
    onLogout: () => void;
    onCreateTracker: () => void;
    isLoading: boolean;
    activeTrackerId: string | null;
    userEmail?: string | null;
    currentUserId?: string | null;
    trackerSummaries: Record<string, TrackerSummary | undefined>;
}

const HomePage: React.FC<HomePageProps> = ({
                                               trackers,
                                               onOpenTracker,
                                               onLogout,
                                               onCreateTracker,
                                               isLoading,
                                               activeTrackerId,
                                               trackerSummaries,
                                           }) => {
    const sortedTrackers = [...trackers].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-3 py-6 sm:py-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <header
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 sm:px-6 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img
                                src="/Soullinktracker-Logo - cropped.png"
                                alt="Soullink Tracker Logo"
                                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow"
                            />
                            <div>
                                <h1 className="text-xl sm:text-3xl font-press-start text-gray-900 dark:text-gray-100 mt-2">
                                    Soullink Tracker
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Willkommen Trainer – verwalte hier deine Abenteuer
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <DarkModeToggle/>
                                <button
                                    onClick={onLogout}
                                    className={`inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                                >
                                    <FiLogOut/> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <section
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-6 sm:px-6 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Deine Tracker</p>
                            <h2 className="text-xl font-semibold mt-1">Alle Tracker auf einen Blick</h2>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end sm:flex-row sm:gap-3">
                            <button
                                type="button"
                                onClick={onCreateTracker}
                                className={`inline-flex items-center gap-2 justify-center rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-green-700 ${focusRingClasses}`}
                            >
                                <FiPlus/> Neuer Tracker
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                                <div
                                    className="h-10 w-10 border-4 border-gray-200 dark:border-gray-600 border-t-green-600 rounded-full animate-spin"/>
                                <p className="text-sm font-medium">Tracker werden geladen…</p>
                            </div>
                        </div>
                    ) : sortedTrackers.length === 0 ? (
                        <div
                            className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-600 dark:text-gray-300">
                            <p className="text-base font-semibold">Noch keine Tracker vorhanden</p>
                            <p className="text-sm mt-2">Erstelle deinen ersten Tracker und lade deine Mitspieler
                                ein.</p>
                            <button
                                type="button"
                                onClick={onCreateTracker}
                                className={`mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-green-700 ${focusRingClasses}`}
                            >
                                <FiPlus/> Jetzt starten
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {sortedTrackers.map((tracker) => {
                                const memberCount = Object.keys(tracker.members ?? {}).length;
                                const isActive = tracker.id === activeTrackerId;
                                const summary = trackerSummaries[tracker.id];
                                const activePokemon = (summary?.teamCount ?? 0) + (summary?.boxCount ?? 0);
                                const deadPokemon = summary?.deathCount ?? 0;
                                const runNumber = summary?.runs ?? 0;
                                const progressLabel = summary?.progressLabel ?? 'Noch keine Arena';
                                return (
                                    <div
                                        key={tracker.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onOpenTracker(tracker.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                onOpenTracker(tracker.id);
                                            }
                                        }}
                                        className={`rounded-lg border px-4 py-5 shadow-sm transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f0f0] dark:focus-visible:ring-offset-transparent hover:transform hover:scale-[1.02] hover:shadow-md ${
                                            isActive
                                                ? 'border-green-500 bg-green-50/70 dark:border-green-500 dark:bg-green-900/10'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
                                                    {new Date(tracker.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-semibold">
                                                    <FiUsers/> {memberCount} Mitglieder
                                                </span>
                                                <div className="ml-auto shrink-0">
                                                    <GameVersionBadge gameVersionId={tracker.gameVersionId}/>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tracker.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {(() => {
                                                        const names = Array.isArray(tracker.playerNames) && tracker.playerNames.length > 0
                                                            ? tracker.playerNames
                                                            : [tracker.player1Name, tracker.player2Name].filter(Boolean);
                                                        return names.length ? names.join(' • ') : 'Unbekannte Spieler';
                                                    })()}
                                                </p>
                                            </div>
                                            <div
                                                className="flex flex-col gap-4">
                                                <div className="grid grid-cols-4 gap-3 w-full">
                                                    {/* Progress field (takes 2 columns) */}
                                                    <div className="col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-500">Fortschritt</p>
                                                            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-500">Run {runNumber}</p>
                                                        </div>
                                                        <div className="relative group">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{progressLabel}</p>
                                                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-w-[200px] text-xs">
                                                                {progressLabel}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Stats fields (1 column each) */}
                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-3 text-center">
                                                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-500 whitespace-nowrap">Aktiv</p>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{activePokemon}</p>
                                                    </div>
                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-3 text-center">
                                                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-500 whitespace-nowrap">Tot</p>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{deadPokemon}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default HomePage;
