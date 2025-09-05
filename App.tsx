import React, { useState, useEffect, useCallback } from 'react';
import type { AppState, PokemonPair } from './types';
import { INITIAL_STATE, PLAYER1_COLOR, PLAYER2_COLOR, createPokemonPair } from './constants';
import TeamTable from './components/TeamTable';
import InfoPanel from './components/InfoPanel';
import Graveyard from './components/Graveyard';
import SettingsPage from './components/SettingsPage';
import AddLostPokemonModal from './components/AddLostPokemonModal';

const App: React.FC = () => {
  const [data, setData] = useState<AppState>(() => {
    try {
      const savedData = localStorage.getItem('soullinkData');
      return savedData ? JSON.parse(savedData) : INITIAL_STATE;
    } catch (error) {
      console.error("Error loading data from localStorage", error);
      return INITIAL_STATE;
    }
  });
  
  const [view, setView] = useState<'tracker' | 'settings'>('tracker');
  const [isAddLostModalOpen, setIsAddLostModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('soullinkData', JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data to localStorage", error);
    }
  }, [data]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setData(INITIAL_STATE);
    }
  };

  const updateNestedState = (
    setter: React.Dispatch<React.SetStateAction<AppState>>,
    key: keyof AppState,
    index: number,
    field: string,
    subField: string | null,
    value: string
  ) => {
    setter(prev => {
      const newArray = [...(prev[key] as any[])];
      if (subField) {
        newArray[index] = {
          ...newArray[index],
          [field]: {
            ...newArray[index][field],
            [subField]: value,
          },
        };
      } else {
        newArray[index] = {
          ...newArray[index],
          [field]: value,
        };
      }
      return { ...prev, [key]: newArray };
    });
  };

  const handleTeamChange = useCallback((index: number, player: 'player1' | 'player2', field: string, value: string) => {
    updateNestedState(setData, 'team', index, player, field, value);
  }, []);
  
  const handleRouteChange = useCallback((index: number, value: string) => {
    updateNestedState(setData, 'team', index, 'route', null, value);
  }, []);

  const handleBoxChange = useCallback((index: number, player: 'player1' | 'player2', field: string, value: string) => {
    updateNestedState(setData, 'box', index, player, field, value);
  }, []);

  const handleBoxRouteChange = useCallback((index: number, value: string) => {
    updateNestedState(setData, 'box', index, 'route', null, value);
  }, []);

  const handleLevelCapChange = useCallback((index: number, value: string) => {
    updateNestedState(setData, 'levelCaps', index, 'level', null, value);
  }, []);

  const handleStatChange = (stat: keyof AppState['stats'], value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: numValue } }));
    }
  };
  
  const handleNestedStatChange = (group: keyof AppState['stats'], key: string, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
        setData(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                [group]: {
                    ...(prev.stats[group] as object),
                    [key]: numValue,
                }
            }
        }));
    }
  };

  const handlePlayerNameChange = (player: 'player1Name' | 'player2Name', name: string) => {
    setData(prev => ({ ...prev, [player]: name }));
  };
  
  const handleAddToGraveyard = useCallback((pair: PokemonPair, from: 'team' | 'box') => {
    if (!window.confirm('Are you sure you want to move this pair to the graveyard? This action cannot be undone.')) {
        return;
    }

    setData(prev => {
        const newTeam = from === 'team'
            ? prev.team.map(p => (p.id === pair.id ? createPokemonPair(p.id) : p))
            : prev.team;
        
        const newBox = from === 'box'
            ? prev.box.map(p => (p.id === pair.id ? createPokemonPair(p.id) : p))
            : prev.box;

        return {
            ...prev,
            graveyard: [pair, ...prev.graveyard],
            team: newTeam,
            box: newBox,
            stats: {
                ...prev.stats,
                deaths: {
                    player1: prev.stats.deaths.player1 + 1,
                    player2: prev.stats.deaths.player2 + 1,
                },
            },
        };
    });
  }, []);

  const handleManualAddToGraveyard = useCallback((route: string, p1Name: string, p2Name: string) => {
    if (!route) {
        alert('Route field is required.');
        return;
    }

    setData(prev => {
        const newPair: PokemonPair = {
            id: Date.now(),
            route: route,
            player1: { name: p1Name || "Failed Encounter", nickname: "N/A", type1: "", type2: "" },
            player2: { name: p2Name || "Failed Encounter", nickname: "N/A", type1: "", type2: "" },
        };

        return {
            ...prev,
            graveyard: [newPair, ...prev.graveyard],
            stats: {
                ...prev.stats,
                deaths: {
                    player1: prev.stats.deaths.player1 + 1,
                    player2: prev.stats.deaths.player2 + 1,
                },
            },
        };
    });
    setIsAddLostModalOpen(false);
  }, []);


  if (view === 'settings') {
    return (
      <SettingsPage
        player1Name={data.player1Name}
        player2Name={data.player2Name}
        onNameChange={handlePlayerNameChange}
        onBack={() => setView('tracker')}
      />
    );
  }

  return (
    <>
      <AddLostPokemonModal
        isOpen={isAddLostModalOpen}
        onClose={() => setIsAddLostModalOpen(false)}
        onAdd={handleManualAddToGraveyard}
        player1Name={data.player1Name}
        player2Name={data.player2Name}
      />
      <div className="bg-[#f0f0f0] min-h-screen p-2 sm:p-4 md:p-8 text-gray-800">
        <div className="max-w-[1920px] mx-auto bg-white shadow-lg p-4 rounded-lg">
          <header className="relative text-center py-4 border-b-2 border-gray-300">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start tracking-tighter">
              {data.player1Name} &amp; {data.player2Name} Soullink
            </h1>
            <p className="text-sm text-gray-500 mt-2">Pokémon Schwarz 2 Challenge Tracker</p>
            <button onClick={() => setView('settings')} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-gray-800 transition-colors" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </header>

          <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 space-y-8">
              <TeamTable
                title={`Team ${data.player1Name}`}
                title2={`Team ${data.player2Name}`}
                player1Name={data.player1Name}
                player2Name={data.player2Name}
                color1={PLAYER1_COLOR}
                color2={PLAYER2_COLOR}
                data={data.team}
                onPokemonChange={handleTeamChange}
                onRouteChange={handleRouteChange}
                onAddToGraveyard={(pair) => handleAddToGraveyard(pair, 'team')}
                isTeam
              />
              <TeamTable
                title={`Box 1 ${data.player1Name}`}
                title2={`Box 1 ${data.player2Name}`}
                player1Name={data.player1Name}
                player2Name={data.player2Name}
                color1={PLAYER1_COLOR}
                color2={PLAYER2_COLOR}
                data={data.box}
                onPokemonChange={handleBoxChange}
                onRouteChange={handleBoxRouteChange}
                onAddToGraveyard={(pair) => handleAddToGraveyard(pair, 'box')}
              />
            </div>

            <div className="xl:col-span-1 space-y-6">
              <InfoPanel 
                player1Name={data.player1Name}
                player2Name={data.player2Name}
                levelCaps={data.levelCaps}
                stats={data.stats}
                onLevelCapChange={handleLevelCapChange}
                onStatChange={handleStatChange}
                onNestedStatChange={handleNestedStatChange}
              />
              <Graveyard 
                graveyard={data.graveyard} 
                player1Name={data.player1Name} 
                player2Name={data.player2Name}
                onManualAddClick={() => setIsAddLostModalOpen(true)}
              />
            </div>
          </main>
          
          <footer className="text-center mt-8 py-4 border-t-2 border-gray-200">
              <button 
                onClick={handleReset}
                className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Reset Tracker
              </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;