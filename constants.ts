import type { AppState, Pokemon, PokemonPair } from './types';

// Exported and typed helper function
export const createEmptyPokemon = (): Pokemon => ({
  name: '',
  nickname: '',
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
  team: [],
  box: [],
  graveyard: [],
  levelCaps: [
    { id: 1, arena: '1. Arena', level: '14/12', done: false },
    { id: 2, arena: '2. Arena', level: '20/18', done: false },
    { id: 3, arena: '3. Arena', level: '23/21', done: false },
    { id: 4, arena: '4. Arena', level: '27/25', done: false },
    { id: 5, arena: '5. Arena', level: '31/29', done: false },
    { id: 6, arena: '6. Arena', level: '35/33', done: false },
    { id: 7, arena: '7. Arena', level: '39/37', done: false },
    { id: 8, arena: '8. Arena', level: '43/31', done: false },
    { id: 9, arena: 'Top 4', level: '50/48', done: false },
    { id: 10, arena: 'Champ', level: '52/50', done: false },
  ],
  stats: {
    runs: 1,
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
