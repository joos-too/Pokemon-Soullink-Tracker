import React from 'react';
import { PLAYER1_COLOR, PLAYER2_COLOR } from '@/constants';

interface SettingsPageProps {
  player1Name: string;
  player2Name: string;
  onNameChange: (player: 'player1Name' | 'player2Name', name: string) => void;
  onBack: () => void;
  legendaryTrackerEnabled: boolean;
  onlegendaryTrackerToggle: (enabled: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ player1Name, player2Name, onNameChange, onBack, legendaryTrackerEnabled, onlegendaryTrackerToggle }) => {
  return (
      <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg">
          <header className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold font-press-start dark:text-gray-100">Einstellungen</h1>
          </header>

          <main className="mt-6 space-y-6">
            <div>
              <label htmlFor="player1Name" className="block text-sm font-bold mb-2" style={{color: PLAYER1_COLOR}}>
                Name Spieler 1
              </label>
              <input
                  id="player1Name"
                  type="text"
                  value={player1Name}
                  onChange={(e) => onNameChange('player1Name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="player2Name" className="block text-sm font-bold mb-2" style={{color: PLAYER2_COLOR}}>
                Name Spieler 2
              </label>
              <input
                  id="player2Name"
                  type="text"
                  value={player2Name}
                  onChange={(e) => onNameChange('player2Name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-bold font-press-start dark:text-gray-100 text-center mb-4">Tracker</h2>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200">Legendary Tracker</span>
                <label htmlFor="legendary-toggle" className="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" checked={legendaryTrackerEnabled} onChange={(e) => onlegendaryTrackerToggle(e.target.checked)} id="legendary-toggle" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </main>

          <footer className="mt-8 text-center">
            <button
                onClick={onBack}
                className="bg-gray-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-gray-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Zurück zum Tracker
            </button>
          </footer>
        </div>
      </div>
  );
};

export default SettingsPage;
