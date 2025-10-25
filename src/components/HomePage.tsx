import React from 'react';
import {FiUsers, FiTarget, FiMapPin, FiArchive, FiLogOut, FiChevronRight} from 'react-icons/fi';
import DarkModeToggle from '@/src/components/DarkModeToggle';
import type {AppState} from '@/types';

interface HomePageProps {
    player1Name: string;
    player2Name: string;
    stats: AppState['stats'];
    teamCount: number;
    boxCount: number;
    graveyardCount: number;
    clearedRoutesCount: number;
    onOpenTracker: () => void;
    onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
                                               player1Name,
                                               player2Name,
                                               stats,
                                               teamCount,
                                               boxCount,
                                               graveyardCount,
                                               clearedRoutesCount,
                                               onOpenTracker,
                                               onLogout,
                                           }) => {
    const trackerTitle = `${player1Name} & ${player2Name}`;

    return (
        <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-3 py-6 sm:py-10">
            <div className="max-w-4xl mx-auto space-y-6">
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
                                    Übersicht über deine Tracker
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DarkModeToggle />
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <FiLogOut /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-6 sm:px-6 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
                    <div className="mb-6">
                        <p className="text-xs uppercase tracking-[0.3em] text-green-600">Team</p>
                        <h2 className="text-xl font-semibold mt-1">{trackerTitle}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            className="rounded-md border border-gray-200 dark:border-gray-700 p-4 text-center bg-gray-50 dark:bg-gray-900">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Runs</p>
                            <p className="mt-2 text-3xl font-press-start">{stats.runs}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versuch</p>
                        </div>
                        <div
                            className="rounded-md border border-gray-200 dark:border-gray-700 p-4 text-center bg-gray-50 dark:bg-gray-900">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Bestleistung</p>
                            <p className="mt-2 text-3xl font-press-start">{stats.best ?? 0}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Arenen geschafft</p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-[#f7f3e8] text-gray-800">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-600">Spielstand</p>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FiUsers/> Team
                                    </span>
                                    <span className="font-press-start">{teamCount}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FiArchive/> Box
                                    </span>
                                    <span className="font-press-start">{boxCount}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FiTarget/> Gestorbene Pokémon
                                    </span>
                                    <span className="font-press-start">{graveyardCount}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FiMapPin/> Abgegraste Routen
                                    </span>
                                    <span className="font-press-start">{clearedRoutesCount}</span>
                                </li>
                            </ul>
                        </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    onClick={onOpenTracker}
                    className="inline-flex items-center justify-center gap-3 rounded-md border-2 border-gray-900 dark:border-white bg-green-600 text-white font-press-start px-5 py-3 text-sm tracking-[0.2em] hover:bg-green-700 transition"
                >
                    Tracker öffnen
                    <FiChevronRight/>
                </button>
            </div>
        </section>
</div>
</div>
)
    ;
};

export default HomePage;
