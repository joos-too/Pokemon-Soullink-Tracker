import { Pokedex } from 'pokeapi-js-wrapper';

// Shared PokeAPI client instance
const P = new Pokedex({
  timeout: 10 * 1000,
});

export default P;
