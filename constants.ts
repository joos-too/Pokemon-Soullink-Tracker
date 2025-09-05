import type { AppState, Pokemon, PokemonPair } from './types';

// Exported and typed helper function
export const createEmptyPokemon = (): Pokemon => ({
  name: '',
  nickname: '',
  type1: '',
  type2: '',
});

// Exported and typed helper function
export const createPokemonPair = (id: number): PokemonPair => ({
  id,
  player1: createEmptyPokemon(),
  player2: createEmptyPokemon(),
  route: '',
});


export const PLAYER1_COLOR = '#cf5930';
export const PLAYER2_COLOR = '#693992';

export const INITIAL_STATE: AppState = {
  player1Name: 'Trymacs',
  player2Name: 'Rumathra',
  team: Array.from({ length: 6 }, (_, i) => createPokemonPair(i + 1)),
  box: Array.from({ length: 30 }, (_, i) => createPokemonPair(i + 1)),
  graveyard: [],
  levelCaps: [
    { id: 1, arena: '1. Arena', level: '13/11' },
    { id: 2, arena: '2. Arena', level: '18/16' },
    { id: 3, arena: '3. Arena', level: '24/22' },
    { id: 4, arena: '4. Arena', level: '30/28' },
    { id: 5, arena: '5. Arena', level: '33/31' },
    { id: 6, arena: '6. Arena', level: '39/37' },
    { id: 7, arena: '7. Arena', level: '48/46' },
    { id: 8, arena: '8. Arena', level: '51/49' },
    { id: 9, arena: 'Top 4', level: '58/56' },
    { id: 10, arena: 'Champ', level: '59/57' },
  ],
  stats: {
    runs: 3,
    best: 8,
    top4Items: {
      player1: 0,
      player2: 0,
    },
    deaths: {
      player1: 0,
      player2: 0,
    },
  },
};