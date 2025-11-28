import { Pokedex } from "pokeapi-js-wrapper";

// Create a PokeAPI client instance to activate caching
const P = new Pokedex({
  timeout: 10 * 1000,
  cacheImages: true,
});

export default P;
