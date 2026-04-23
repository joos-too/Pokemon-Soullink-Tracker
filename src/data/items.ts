export interface FossilDef {
  id: string;
  gen: number;
  sprite: string;
}

export interface StoneDef {
  id: string;
  gen: number;
  sprite: string;
}

export const FOSSILS: FossilDef[] = [
  { id: "helix-fossil", gen: 1, sprite: "gen1/helix-fossil.png" },
  { id: "dome-fossil", gen: 1, sprite: "gen1/dome-fossil.png" },
  { id: "old-amber", gen: 1, sprite: "gen1/old-amber.png" },
  { id: "root-fossil", gen: 3, sprite: "gen3/root-fossil.png" },
  { id: "claw-fossil", gen: 3, sprite: "gen3/claw-fossil.png" },
  { id: "skull-fossil", gen: 4, sprite: "gen4/skull-fossil.png" },
  { id: "armor-fossil", gen: 4, sprite: "gen4/armor-fossil.png" },
  { id: "cover-fossil", gen: 5, sprite: "gen5/cover-fossil.png" },
  { id: "plume-fossil", gen: 5, sprite: "gen5/plume-fossil.png" },
  { id: "jaw-fossil", gen: 6, sprite: "gen6/jaw-fossil.png" },
  { id: "sail-fossil", gen: 6, sprite: "gen6/sail-fossil.png" },
];

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
