import React from 'react';
import {FiLogOut, FiPlus, FiUsers, FiShield, FiArrowRightCircle} from 'react-icons/fi';
import DarkModeToggle from '@/src/components/DarkModeToggle';
import type {TrackerMeta} from '@/types';

interface HomePageProps {
  trackers: TrackerMeta[];
  onOpenTracker: (trackerId: string) => void;
  onLogout: () => void;
  onCreateTracker: () => void;
  isLoading: boolean;
  activeTrackerId: string | null;
  userEmail?: string | null;
}

const HomePage: React.FC<HomePageProps> = ({
  trackers,
  onOpenTracker,
  onLogout,
  onCreateTracker,
  isLoading,
  activeTrackerId,
}) => {
  const sortedTrackers = [...trackers].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-3 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-5 sm:px-6 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
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
                <DarkModeToggle />
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
              <button
                type="button"
                onClick={onCreateTracker}
                className="inline-flex items-center gap-2 justify-center rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
              >
                <FiPlus /> Neuer Tracker
              </button>
            </div>
          </div>
        </header>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-6 sm:px-6 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-600">Deine Tracker</p>
              <h2 className="text-xl font-semibold mt-1">Alle Sessions auf einen Blick</h2>
            </div>
            {activeTrackerId && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Zuletzt geöffnet: <span className="font-semibold">{trackers.find(t => t.id === activeTrackerId)?.title}</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                <div className="h-10 w-10 border-4 border-gray-200 dark:border-gray-600 border-t-green-600 rounded-full animate-spin" />
                <p className="text-sm font-medium">Tracker werden geladen…</p>
              </div>
            </div>
          ) : sortedTrackers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-600 dark:text-gray-300">
              <p className="text-base font-semibold">Noch keine Tracker vorhanden</p>
              <p className="text-sm mt-2">Erstelle deinen ersten Tracker und lade deine Mitspieler ein.</p>
              <button
                type="button"
                onClick={onCreateTracker}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-green-700"
              >
                <FiPlus /> Jetzt starten
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedTrackers.map((tracker) => {
                const memberCount = Object.keys(tracker.members ?? {}).length;
                const isActive = tracker.id === activeTrackerId;
                return (
                  <div
                    key={tracker.id}
                    className={`rounded-lg border px-4 py-5 shadow-sm transition ${
                      isActive
                        ? 'border-green-500 bg-green-50/70 dark:border-green-500 dark:bg-green-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{new Date(tracker.createdAt).toLocaleDateString()}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{tracker.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {tracker.player1Name} &amp; {tracker.player2Name}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-semibold">
                        <FiUsers /> {memberCount} Mitglieder
                      </span>
                      {tracker.members && Object.values(tracker.members).some(member => member.role === 'owner') && (
                        <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                          <FiShield /> Owner vorhanden
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenTracker(tracker.id)}
                      className="mt-5 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Öffnen
                      <FiArrowRightCircle />
                    </button>
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
