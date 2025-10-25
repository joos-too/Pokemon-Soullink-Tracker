export interface Pokemon {
  name: string;
  nickname: string;
}

export interface PokemonPair {
  id: number;
  player1: Pokemon;
  player2: Pokemon;
  route: string;
}

export interface LevelCap {
  id: number;
  arena: string;
  level: string;
  done?: boolean;
}

export interface RivalCap {
  id: number;
  location: string;
  rival: string;
  level: string;
  done?: boolean;
  revealed?: boolean;
}

export interface Stats {
  runs: number;
  best: number;
  top4Items: {
    player1: number;
    player2: number;
  };
  deaths: {
    player1: number;
    player2: number;
  };
  sumDeaths?: {
    player1: number;
    player2: number;
  };
  legendaryEncounters?: number;
}

export interface AppState {
  player1Name: string;
  player2Name: string;
  team: PokemonPair[];
  box: PokemonPair[];
  graveyard: PokemonPair[];
  rules: string[];
  levelCaps: LevelCap[];
  rivalCaps: RivalCap[];
  stats: Stats;
  legendaryTrackerEnabled?: boolean;
  rivalCensorEnabled?: boolean;
}

export type TrackerRole = 'owner' | 'editor';

export interface TrackerMember {
  uid: string;
  email: string;
  role: TrackerRole;
  addedAt: number;
}

export interface TrackerMeta {
  id: string;
  title: string;
  player1Name: string;
  player2Name: string;
  createdBy: string;
  createdAt: number;
  members: Record<string, TrackerMember>;
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
  email: string;
  emailLowerCase: string;
  createdAt: number;
  lastLoginAt: number;
}
