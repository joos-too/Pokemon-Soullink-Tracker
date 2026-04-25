export interface FossilDef {
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
