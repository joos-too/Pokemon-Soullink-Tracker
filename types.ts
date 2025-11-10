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
  hardcoreModeEnabled?: boolean;
  runStartedAt?: number;
}

export type TrackerRole = 'owner' | 'editor';

export type RivalGender = 'male' | 'female';

export interface UserSettings {
  rivalPreferences?: Record<string, RivalGender>;
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
    levelCaps: Omit<LevelCap, 'done'>[];
    rivalCaps: Omit<RivalCap, 'done' | 'revealed'>[];
}

export interface TrackerMeta {
  id: string;
  title: string;
  player1Name: string;
  player2Name: string;
  createdBy: string;
  createdAt: number;
  members: Record<string, TrackerMember>;
  gameVersionId: string;
  userSettings?: Record<string, UserSettings>;
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
