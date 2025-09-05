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
  player1Name: 'Jan',
  player2Name: 'Felix',
  team: Array.from({ length: 6 }, (_, i) => createPokemonPair(i + 1)),
  box: Array.from({ length: 30 }, (_, i) => createPokemonPair(i + 1)),
  graveyard: [],
  levelCaps: [
    { id: 1, arena: '1. Arena', level: '14/12' },
    { id: 2, arena: '2. Arena', level: '20/18' },
    { id: 3, arena: '3. Arena', level: '23/21' },
    { id: 4, arena: '4. Arena', level: '27/25' },
    { id: 5, arena: '5. Arena', level: '31/29' },
    { id: 6, arena: '6. Arena', level: '35/33' },
    { id: 7, arena: '7. Arena', level: '39/37' },
    { id: 8, arena: '8. Arena', level: '43/31' },
    { id: 9, arena: 'Top 4', level: '50/48' },
    { id: 10, arena: 'Champ', level: '52/50' },
  ],
  stats: {
    runs: 0,
    best: 0,
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