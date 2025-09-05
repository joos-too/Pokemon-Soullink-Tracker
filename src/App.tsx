
import React, { useState, useEffect, useCallback } from 'react';
import type { AppState, PokemonPair, LevelCap } from './types';
import { INITIAL_STATE, PLAYER1_NAME, PLAYER2_NAME, PLAYER1_COLOR, PLAYER2_COLOR } from './constants';
import TeamTable from './components/TeamTable';
import InfoPanel from './components/InfoPanel';
import Graveyard from './components/Graveyard';

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

  // FIX: Corrected the function signature for updateNestedState to resolve generic type inference issues.
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
  
  const handleAddToGraveyard = useCallback((pair: PokemonPair) => {
    setData(prev => ({
      ...prev,
      graveyard: [...prev.graveyard, pair],
      team: prev.team.map(p => p.id === pair.id ? INITIAL_STATE.team.find(ip => ip.id === pair.id) || p : p),
      box: prev.box.map(p => p.id === pair.id ? INITIAL_STATE.box.find(ip => ip.id === pair.id) || p : p),
      stats: {
        ...prev.stats,
        deaths: {
          player1: prev.stats.deaths.player1 + 1,
          player2: prev.stats.deaths.player2 + 1
        }
      }
    }));
  }, []);


  return (
    <div className="bg-[#f0f0f0] min-h-screen p-2 sm:p-4 md:p-8 text-gray-800">
      <div className="max-w-[1920px] mx-auto bg-white shadow-lg p-4 rounded-lg">
        <header className="text-center py-4 border-b-2 border-gray-300">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start tracking-tighter">
            {PLAYER1_NAME} &amp; {PLAYER2_NAME} Soullink
          </h1>
          <p className="text-sm text-gray-500 mt-2">Pokémon Schwarz 2 Challenge Tracker</p>
        </header>

        <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="xl:col-span-2 space-y-8">
            <TeamTable
              title={`Team ${PLAYER1_NAME}`}
              title2={`Team ${PLAYER2_NAME}`}
              color1={PLAYER1_COLOR}
              color2={PLAYER2_COLOR}
              data={data.team}
              onPokemonChange={handleTeamChange}
              onRouteChange={handleRouteChange}
              onAddToGraveyard={handleAddToGraveyard}
              isTeam
            />
            <TeamTable
              title={`Box 1 ${PLAYER1_NAME}`}
              title2={`Box 1 ${PLAYER2_NAME}`}
              color1={PLAYER1_COLOR}
              color2={PLAYER2_COLOR}
              data={data.box}
              onPokemonChange={handleBoxChange}
              onRouteChange={handleBoxRouteChange}
              onAddToGraveyard={handleAddToGraveyard}
            />
          </div>

          <div className="xl:col-span-1 space-y-6">
            <InfoPanel 
              levelCaps={data.levelCaps}
              stats={data.stats}
              onLevelCapChange={handleLevelCapChange}
              onStatChange={handleStatChange}
              onNestedStatChange={handleNestedStatChange}
            />
            <Graveyard graveyard={data.graveyard} />
          </div>
        </main>
        
        <footer className="text-center mt-8 py-4 border-t-2 border-gray-200">
            <button 
              onClick={handleReset}
              className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Reset Tracker
            </button>
            <p className="text-xs text-gray-400 mt-3">Doc von der einzig wahren Pokemonmeisterin Jenno aka. Louki</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
