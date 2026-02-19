import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FossilEntry } from "@/types";
import { FOSSILS, PLAYER_COLORS } from "@/constants";
import { FiPlus, FiCheck, FiEdit, FiSave, FiX } from "react-icons/fi";
import AddFossilModal from "./AddFossilModal";

interface FossilTrackerProps {
  playerNames: string[];
  fossils: FossilEntry[][];
  maxGeneration: number;
  infiniteFossilsEnabled: boolean;
  onAddFossil: (
    playerIndex: number,
    fossilId: string,
    location: string,
    inBag: boolean,
  ) => void;
  onToggleBag: (playerIndex: number, fossilIndex: number) => void;
  onRevive: (selectedIndices: number[]) => void;
  onUpdateFossils: (newFossils: FossilEntry[][]) => void; // Neu: Um alle Fossile nach dem Edit zu speichern
  readOnly?: boolean;
  gameVersionId?: string;
}

const FossilTracker: React.FC<FossilTrackerProps> = ({
  playerNames,
  fossils,
  maxGeneration,
  infiniteFossilsEnabled,
  onAddFossil,
  onToggleBag,
  onRevive,
  onUpdateFossils,
  readOnly = false,
  gameVersionId,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftFossils, setDraftFossils] = useState<FossilEntry[][]>([]);

  const [modalOpen, setModalOpen] = useState<{
    open: boolean;
    playerIndex: number;
  }>({
    open: false,
    playerIndex: 0,
  });

  const [selections, setSelections] = useState<number[]>(
    playerNames.map(() => -1),
  );

  // Initialisierung der Draft-Daten beim Starten des Edits
  const startEditing = () => {
    setDraftFossils(JSON.parse(JSON.stringify(fossils)));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftFossils([]);
  };

  const saveEditing = () => {
    onUpdateFossils(draftFossils);
    setIsEditing(false);
  };

  const deleteFossil = (pIdx: number, fIdx: number) => {
    setDraftFossils((prev) => {
      const next = [...prev];
      next[pIdx] = next[pIdx].filter((_, i) => i !== fIdx);
      return next;
    });
  };

  const displayFossils = isEditing ? draftFossils : fossils;

  const canRevive =
    !isEditing && // Während des Edits keine Wiederbelebung
    displayFossils.every((list) => list.some((f) => f.inBag && !f.revived)) &&
    selections.every((idx) => idx !== -1);

  const handleReviveClick = () => {
    if (!canRevive) return;
    onRevive(selections);
    setSelections(playerNames.map(() => -1));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="relative flex justify-center items-center p-2 bg-gray-800 dark:bg-gray-900">
        <h2 className="text-center text-white font-press-start text-sm">
          {t("tracker.infoPanel.fossilTracker")}
        </h2>

        {!readOnly && (
          <div className="absolute right-2 flex gap-2">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow bg-gray-800 text-white hover:bg-gray-700"
                title={t("tracker.infoPanel.editFossils")}
              >
                <FiEdit size={12} />{" "}
                <span className="hidden sm:inline">
                  {t("tracker.infoPanel.editFossils")}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEditing}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 shadow"
                >
                  <FiX size={12} />{" "}
                  <span className="hidden sm:inline">
                    {t("tracker.infoPanel.cancelFossils")}
                  </span>
                </button>
                <button
                  onClick={saveEditing}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow"
                >
                  <FiSave size={12} />{" "}
                  <span className="hidden sm:inline">
                    {t("tracker.infoPanel.saveFossils")}
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div
          className="grid gap-4 grid-cols-1"
          style={{
            gridTemplateColumns:
              playerNames.length > 1
                ? `repeat(${playerNames.length}, minmax(0, 1fr))`
                : undefined,
          }}
        >
          {playerNames.map((name, pIdx) => (
            <div key={`fossil-player-${pIdx}`} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-xs font-bold truncate mr-2"
                  style={{ color: PLAYER_COLORS[pIdx] }}
                >
                  {name}
                </span>
                {!readOnly && (
                  <button
                    onClick={() =>
                      setModalOpen({ open: true, playerIndex: pIdx })
                    }
                    disabled={isEditing}
                    className={`p-1 rounded text-white transition-colors flex-shrink-0 ${
                      isEditing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <FiPlus size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1 px-1">
                {displayFossils[pIdx]?.map((entry, fIdx) => {
                  const def = FOSSILS.find((f) => f.id === entry.fossilId);
                  const isSelected = selections[pIdx] === fIdx;
                  const canBeSelected =
                    entry.inBag && !entry.revived && !isEditing;

                  return (
                    <div
                      key={`${pIdx}-${entry.fossilId}-${fIdx}`}
                      onClick={() => {
                        if (readOnly || !canBeSelected) return;
                        setSelections((prev) => {
                          const next = [...prev];
                          next[pIdx] = next[pIdx] === fIdx ? -1 : fIdx;
                          return next;
                        });
                      }}
                      className={`flex items-center gap-2 p-1.5 rounded border text-[10px] transition-all ${
                        entry.revived
                          ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 cursor-default"
                          : isSelected
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500 cursor-pointer"
                            : !entry.inBag && !isEditing
                              ? "border-gray-200 dark:border-gray-700 opacity-60 cursor-default"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 cursor-pointer"
                      }`}
                    >
                      <img
                        src={`/fossil-sprites/${def?.sprite}`}
                        alt=""
                        className={`w-6 h-6 object-contain ${entry.revived ? "grayscale-[0.5]" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">
                          {t(`fossils.${entry.fossilId}`)}
                        </div>
                        <div className="opacity-70 truncate">
                          {entry.revived
                            ? entry.pokemonName
                              ? `${t("tracker.infoPanel.fossilRevived")}: ${entry.pokemonName}`
                              : t("tracker.infoPanel.fossilRevived")
                            : entry.inBag
                              ? t("tracker.infoPanel.fossilBag")
                              : t("tracker.infoPanel.fossilLocation", {
                                  location: entry.location,
                                })}
                        </div>
                      </div>

                      {/* Löschen Button (im Edit Modus) */}
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFossil(pIdx, fIdx);
                          }}
                          className="p-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 flex-shrink-0"
                        >
                          <FiX size={12} />
                        </button>
                      )}

                      {/* In Beutel verschieben Button (nur wenn nicht im Edit Modus) */}
                      {!isEditing &&
                        !entry.inBag &&
                        !entry.revived &&
                        !readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBag(pIdx, fIdx);
                            }}
                            className="p-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 flex-shrink-0"
                            title={t("tracker.infoPanel.fossilBag")}
                          >
                            <FiCheck size={12} />
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={handleReviveClick}
            disabled={!canRevive}
            className={`w-full py-2 rounded-md font-press-start text-[10px] shadow-sm transition-all ${
              canRevive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            {t("tracker.infoPanel.fossilRevive")}
          </button>
        )}
      </div>

      <AddFossilModal
        isOpen={modalOpen.open}
        onClose={() => setModalOpen({ open: false, playerIndex: 0 })}
        maxGeneration={maxGeneration}
        alreadyOwnedIds={
          fossils[modalOpen.playerIndex]?.map((f) => f.fossilId) || []
        }
        infiniteFossilsEnabled={infiniteFossilsEnabled}
        gameVersionId={gameVersionId}
        onAdd={(id, loc, bag) => {
          onAddFossil(modalOpen.playerIndex, id, loc, bag);
          setModalOpen({ open: false, playerIndex: 0 });
        }}
      />
    </div>
  );
};

export default FossilTracker;
