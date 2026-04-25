export interface StoneDef {
  id: string;
  gen: number;
  sprite: string;
}

export const STONES: StoneDef[] = [
  { id: "fire-stone", gen: 1, sprite: "gen1/fire-stone.png" },
  { id: "water-stone", gen: 1, sprite: "gen1/water-stone.png" },
  { id: "thunder-stone", gen: 1, sprite: "gen1/thunder-stone.png" },
  { id: "leaf-stone", gen: 1, sprite: "gen1/leaf-stone.png" },
  { id: "moon-stone", gen: 1, sprite: "gen1/moon-stone.png" },
  { id: "sun-stone", gen: 2, sprite: "gen2/sun-stone.png" },
  { id: "shiny-stone", gen: 4, sprite: "gen4/shiny-stone.png" },
  { id: "dusk-stone", gen: 4, sprite: "gen4/dusk-stone.png" },
  { id: "dawn-stone", gen: 4, sprite: "gen4/dawn-stone.png" },
];
