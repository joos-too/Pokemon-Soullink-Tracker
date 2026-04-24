import React from "react";
import type {
  GameVersion,
  LevelCap,
  RivalCap,
  Stats,
  UserSettings,
} from "@/types.ts";
import Progress from "@/src/components/widgets/progress.tsx";
import Levelcaps from "@/src/components/widgets/levelcaps.tsx";
import RunStats from "@/src/components/widgets/runStats.tsx";
import Items from "@/src/components/widgets/Items.tsx";
import DeathCounter from "@/src/components/widgets/deathCounter.tsx";
import LegendaryTracker from "@/src/components/widgets/legendaryTracker.tsx";
import Rules from "@/src/components/widgets/rules.tsx";

interface InfoPanelProps {
  playerNames: string[];
  playerColors: string[];
  levelCaps: LevelCap[];
  rivalCaps: RivalCap[];
  stats: Stats;
  onLevelCapToggle: (index: number) => void;
  onRivalCapToggleDone: (index: number) => void;
  onRivalCapReveal: (index: number) => void;
  onStatChange: (stat: keyof Stats, value: string) => void;
  onPlayerStatChange: (
    group: keyof Stats,
    playerIndex: number,
    value: string,
  ) => void;
  rules: string[];
  onRulesChange: (rules: string[]) => void;
  legendaryTrackerEnabled: boolean;
  rivalCensorEnabled: boolean;
  hardcoreModeEnabled: boolean;
  onlegendaryIncrement: () => void;
  onlegendaryDecrement: () => void;
  runStartedAt?: number;
  gameVersion?: GameVersion;
  rivalPreferences: UserSettings["rivalPreferences"];
  activeTrackerId?: string | null;
  readOnly?: boolean;
  generationSpritePath?: string | null;
  pokemonGenerationLimit?: number;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  playerNames,
  playerColors,
  levelCaps,
  rivalCaps,
  stats,
  onLevelCapToggle,
  onRivalCapToggleDone,
  onRivalCapReveal,
  onPlayerStatChange,
  rules,
  onRulesChange,
  legendaryTrackerEnabled,
  rivalCensorEnabled,
  hardcoreModeEnabled,
  onlegendaryIncrement,
  onlegendaryDecrement,
  runStartedAt,
  gameVersion,
  rivalPreferences,
  activeTrackerId,
  readOnly = false,
  generationSpritePath,
  pokemonGenerationLimit,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Progress
            levelCaps={levelCaps}
            rivalCaps={rivalCaps}
            runStartedAt={runStartedAt}
            gameVersion={gameVersion}
            hardcoreModeEnabled={hardcoreModeEnabled}
          />
          <RunStats
            stats={stats}
            levelCaps={levelCaps}
            gameVersion={gameVersion}
          />
          <Items
            playerNames={playerNames}
            playerColors={playerColors}
            stats={stats}
            onPlayerStatChange={onPlayerStatChange}
            readOnly={readOnly}
          />
        </div>

        <Levelcaps
          levelCaps={levelCaps}
          rivalCaps={rivalCaps}
          onLevelCapToggle={onLevelCapToggle}
          onRivalCapToggleDone={onRivalCapToggleDone}
          onRivalCapReveal={onRivalCapReveal}
          rivalCensorEnabled={rivalCensorEnabled}
          hardcoreModeEnabled={hardcoreModeEnabled}
          gameVersion={gameVersion}
          rivalPreferences={rivalPreferences}
          activeTrackerId={activeTrackerId}
          readOnly={readOnly}
        />
      </div>

      <div
        className={`grid grid-cols-1 ${legendaryTrackerEnabled ? "md:grid-cols-2" : ""} gap-6`}
      >
        <DeathCounter
          playerNames={playerNames}
          playerColors={playerColors}
          stats={stats}
        />

        {legendaryTrackerEnabled && (
          <LegendaryTracker
            stats={stats}
            onlegendaryIncrement={onlegendaryIncrement}
            onlegendaryDecrement={onlegendaryDecrement}
            readOnly={readOnly}
            generationSpritePath={generationSpritePath}
            pokemonGenerationLimit={pokemonGenerationLimit}
          />
        )}
      </div>

      <Rules rules={rules} onRulesChange={onRulesChange} readOnly={readOnly} />
    </div>
  );
};

export default InfoPanel;
