import React from 'react';
import { PLAYER1_COLOR, PLAYER2_COLOR } from '@/constants';

interface SettingsPageProps {
  player1Name: string;
  player2Name: string;
  onNameChange: (player: 'player1Name' | 'player2Name', name: string) => void;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ player1Name, player2Name, onNameChange, onBack }) => {
  return (
    <div className="bg-[#f0f0f0] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white shadow-lg p-6 rounded-lg">
        <header className="text-center pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold font-press-start">Einstellungen</h1>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
