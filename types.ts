export interface Pokemon {
  name: string;
  nickname: string;
}

export interface PokemonLink {
  id: number;
  route: string;
  members: Pokemon[];
}

export interface LevelCap {
  id: number;
  arena: string;
  level: string;
  done?: boolean;
}

export interface VariableRival {
  name: string;
  key: string;
  options: {
    male: string;
    female: string;
  };
}

export interface RivalCap {
  id: number;
  location: string;
  rival: string | VariableRival;
  level: string;
  done?: boolean;
  revealed?: boolean;
}

export interface Stats {
  runs: number;
  best: number;
  top4Items: number[];
  deaths: number[];
  sumDeaths?: number[];
  legendaryEncounters?: number;
}

export interface AppState {
  playerNames: string[];
  team: PokemonLink[];
  box: PokemonLink[];
  graveyard: PokemonLink[];
  rules: string[];
  levelCaps: LevelCap[];
  rivalCaps: RivalCap[];
  stats: Stats;
  legendaryTrackerEnabled?: boolean;
  rivalCensorEnabled?: boolean;
  hardcoreModeEnabled?: boolean;
  runStartedAt?: number;
}

export type TrackerRole = "owner" | "editor" | "guest";

export type RivalGender = "male" | "female";

export interface UserSettings {
  rivalPreferences?: Record<string, RivalGender>;
  useGenerationSprites?: boolean;
}

export interface TrackerMember {
  uid: string;
  email: string;
  role: TrackerRole;
  addedAt: number;
}

export interface GameVersionBadgeSegment {
  text: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface GameSelectionColor {
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface GameVersion {
  id: string;
  name: string;
  badgeSet: string;
  badge?: {
    segments: GameVersionBadgeSegment[];
  };
  selectionColors?: Record<string, GameSelectionColor>;
  levelCaps: Omit<LevelCap, "done">[];
  rivalCaps: Omit<RivalCap, "done" | "revealed">[];
}

export interface TrackerMeta {
  id: string;
  title: string;
  playerNames: string[];
  player1Name?: string | null;
  player2Name?: string | null;
  player3Name?: string | null;
  createdBy: string;
  createdAt: number;
  members: Record<string, TrackerMember>;
  guests?: Record<string, TrackerMember>;
  gameVersionId: string;
  userSettings?: Record<string, UserSettings>;
  isPublic?: boolean;
}

export interface TrackerSummary {
  teamCount: number;
  boxCount: number;
  graveyardCount: number;
  deathCount: number;
  runs: number;
  championDone: boolean;
  progressLabel: string;
}

export interface UserProfile {
  uid: string;
  createdAt: number;
  lastLoginAt: number;
  useGenerationSprites?: boolean;
  useSpritesInTeamTable?: boolean;
}
