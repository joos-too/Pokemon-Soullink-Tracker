import React, { useEffect, useMemo, useState } from "react";
import type { Pokemon, PokemonLink } from "@/types";
import EditPairModal from "./EditPairModal.tsx";
import SelectEvolveModal from "./SelectEvolveModal";
import {
  FiArrowDown,
  FiArrowUp,
  FiChevronsUp,
  FiEdit,
  FiPlus,
  FiTrash,
} from "react-icons/fi";
import {
  getOfficialArtworkUrlForPokemonName,
  getSpriteUrlForPokemonName,
} from "@/src/services/sprites";
import { useTranslation } from "react-i18next";

interface TeamTableProps {
  title: string;
  data: PokemonLink[];
  playerNames: string[];
  playerColors: string[];
  onPokemonChange: (
    index: number,
    playerIndex: number,
    field: keyof Pokemon,
    value: string,
  ) => void;
  onRouteChange: (index: number, value: string) => void;
  onAddToGraveyard: (pair: PokemonLink) => void;
  onAddLink: (payload: { route: string; members: Pokemon[] }) => void;
  emptyMessage: string;
  addDisabled?: boolean;
  addDisabledReason?: string;
  context: "team" | "box";
  onMoveToTeam: (pair: PokemonLink) => void;
  onMoveToBox: (pair: PokemonLink) => void;
  teamIsFull?: boolean;
  pokemonGenerationLimit?: number;
  gameVersionId?: string;
  readOnly?: boolean;
  generationSpritePath?: string | null;
  useSpritesInTeamTable?: boolean;
}

const TeamTable: React.FC<TeamTableProps> = ({
  title,
  data,
  playerNames,
  playerColors,
  onPokemonChange,
  onRouteChange,
  onAddToGraveyard,
  onAddLink,
  emptyMessage,
  addDisabled = false,
  addDisabledReason,
  context,
  onMoveToTeam,
  onMoveToBox,
  teamIsFull = false,
  pokemonGenerationLimit,
  gameVersionId,
  readOnly = false,
  generationSpritePath,
  useSpritesInTeamTable = false,
}) => {
  const { t } = useTranslation();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [evolveIndex, setEvolveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (readOnly) {
      setEditIndex(null);
      setAddOpen(false);
      setEvolveIndex(null);
    }
  }, [readOnly]);

  const rows = useMemo(
    () =>
      data
        .map((pair, i) => ({ pair, originalIndex: i }))
        .filter(
          ({ pair }) =>
            pair.route || pair.members.some((member) => member?.name),
        ),
    [data],
  );

  const handleSave = (payload: { route: string; members: Pokemon[] }) => {
    if (readOnly || editIndex === null) return;
    payload.members.forEach((member, playerIndex) => {
      onPokemonChange(editIndex, playerIndex, "name", member.name);
      onPokemonChange(editIndex, playerIndex, "nickname", member.nickname);
    });
    onRouteChange(editIndex, payload.route);
    setEditIndex(null);
  };

  const editInitial = useMemo(() => {
    if (editIndex === null) return null;
    const current = data[editIndex];
    return {
      route: current?.route ?? "",
      members: playerNames.map(
        (_, index) => current?.members?.[index] ?? { name: "", nickname: "" },
      ),
    };
  }, [editIndex, data, playerNames]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-press-start text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              if (!addDisabled) setAddOpen(true);
            }}
            disabled={addDisabled}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold shadow ${
              addDisabled
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500"
            }`}
            title={
              addDisabled
                ? addDisabledReason || t("team.addDisabled")
                : t("team.addPokemon")
            }
          >
            <FiPlus size={18} /> {t("team.addPokemon")}
          </button>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="p-2 text-xs font-bold text-gray-700 dark:text-gray-300 border-t border-b border-gray-300 dark:border-gray-700"
              >
                #
              </th>
              {playerNames.map((name, index) => (
                <th
                  key={`player-header-${index}`}
                  colSpan={3}
                  className="p-2 text-xs font-press-start text-white text-center border-t border-b border-l border-gray-300 dark:border-gray-700"
                  style={{ backgroundColor: playerColors[index] ?? "#4b5563" }}
                >
                  {name}
                </th>
              ))}
              <th
                rowSpan={2}
                className="p-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300 border-t border-b border-l border-gray-300 dark:border-gray-700"
              >
                {t("team.routeColumn")}
              </th>
              {!readOnly && (
                <th
                  rowSpan={2}
                  className="p-2 text-xs font-bold text-gray-700 dark:text-gray-300 border-t border-b border-l border-gray-300 dark:border-gray-700"
                  style={{ width: "28px" }}
                >
                  {t("team.actionsColumn")}
                </th>
              )}
            </tr>
            <tr>
              {playerNames.map((_, index) => (
                <React.Fragment key={`player-subheader-${index}`}>
                  <th className="p-1 text-[11px] text-gray-600 dark:text-gray-400 border-b border-l border-gray-200 dark:border-gray-700 text-center">
                    {t("team.pokemonColumn")}
                  </th>
                  <th className="p-1 text-[11px] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center">
                    {t("team.nameColumn")}
                  </th>
                  <th className="p-1 text-[11px] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center">
                    {t("team.nicknameColumn")}
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  className="p-3 text-center text-sm text-gray-500 dark:text-gray-400"
                  colSpan={2 + playerNames.length * 3 + (readOnly ? 0 : 1)}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map(({ pair, originalIndex }, displayIndex) => (
              <tr
                key={pair.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="p-2 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {displayIndex + 1}
                </td>
                {playerNames.map((_, playerIndex) => {
                  const member = pair.members?.[playerIndex] ?? {
                    name: "",
                    nickname: "",
                  };
                  const sprite = member.name
                    ? useSpritesInTeamTable
                      ? getSpriteUrlForPokemonName(
                          member.name,
                          generationSpritePath,
                        )
                      : getOfficialArtworkUrlForPokemonName(member.name)
                    : null;
                  return (
                    <React.Fragment
                      key={`player-cell-${pair.id}-${playerIndex}`}
                    >
                      <td className="p-2 text-center border-l border-gray-200 dark:border-gray-700">
                        {sprite ? (
                          <img
                            src={sprite}
                            alt=""
                            className="w-20 h-20 mx-auto"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-sm text-gray-800 dark:text-gray-300 text-center">
                        {member.name || "-"}
                      </td>
                      <td className="p-2 text-sm text-gray-800 dark:text-gray-300 text-center">
                        {member.nickname || "-"}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="p-2 text-sm text-center text-gray-800 dark:text-gray-200 border-l border-gray-200 dark:border-gray-700">
                  {pair.route || "-"}
                </td>
                {!readOnly && (
                  <td
                    className="p-2 text-center border-l border-gray-200 dark:border-gray-700"
                    style={{ width: "28px" }}
                  >
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      {(pair.members.some((m) => m?.name) || pair.route) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditIndex(originalIndex);
                          }}
                          className="p-1 rounded-full inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          title={t("team.titleEdit")}
                        >
                          <FiEdit size={18} />
                        </button>
                      )}
                      {context === "team" ? (
                        <button
                          type="button"
                          onClick={() => {
                            onMoveToBox(pair);
                          }}
                          className="p-1 rounded-full inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          title={t("team.titleMoveToBox")}
                        >
                          <FiArrowDown size={18} />
                        </button>
                      ) : null}
                      {context === "box" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!teamIsFull) onMoveToTeam(pair);
                          }}
                          disabled={teamIsFull}
                          className={`p-1 rounded-full inline-flex items-center justify-center ${teamIsFull ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"}`}
                          title={
                            teamIsFull
                              ? t("team.teamFull")
                              : t("team.moveToTeam")
                          }
                        >
                          <FiArrowUp size={18} />
                        </button>
                      )}
                      {pair.members.some((member) => member?.name) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEvolveIndex(originalIndex);
                          }}
                          className="p-1 rounded-full inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          title={t("team.titleEvolve")}
                        >
                          <FiChevronsUp size={18} />
                        </button>
                      )}
                      {context === "team" &&
                        pair.members.some((member) => member?.name) && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddToGraveyard(pair);
                            }}
                            className="p-1 rounded-full inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                            title={t("team.titleSendToGraveyard")}
                          >
                            <FiTrash size={18} />
                          </button>
                        )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditPairModal
        isOpen={editIndex !== null}
        onClose={() => setEditIndex(null)}
        onSave={handleSave}
        playerLabels={playerNames}
        mode="edit"
        initial={
          editInitial || {
            route: "",
            members: playerNames.map(() => ({ name: "", nickname: "" })),
          }
        }
        generationLimit={pokemonGenerationLimit}
        gameVersionId={gameVersionId}
        generationSpritePath={generationSpritePath}
      />
      <SelectEvolveModal
        isOpen={evolveIndex !== null}
        onClose={() => setEvolveIndex(null)}
        onConfirm={(playerIndex, newName) => {
          if (evolveIndex === null) return;
          onPokemonChange(evolveIndex, playerIndex, "name", newName);
          setEvolveIndex(null);
        }}
        pair={evolveIndex !== null ? data[evolveIndex] : null}
        playerLabels={playerNames}
        maxGeneration={pokemonGenerationLimit}
        gameVersionId={gameVersionId}
        generationSpritePath={generationSpritePath}
        useSpritesEverywhere={useSpritesInTeamTable}
      />
      <EditPairModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(payload) => {
          onAddLink(payload);
          setAddOpen(false);
        }}
        playerLabels={playerNames}
        mode="create"
        initial={{
          route: "",
          members: playerNames.map(() => ({ name: "", nickname: "" })),
        }}
        generationLimit={pokemonGenerationLimit}
        gameVersionId={gameVersionId}
        generationSpritePath={generationSpritePath}
      />
    </div>
  );
};

export default TeamTable;
