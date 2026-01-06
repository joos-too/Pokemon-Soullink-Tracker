import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FossilEntry } from "@/types";
import { FOSSILS, PLAYER_COLORS } from "@/constants";
import { FiPlus, FiCheck } from "react-icons/fi";
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
  readOnly?: boolean;
}

const FossilTracker: React.FC<FossilTrackerProps> = ({
  playerNames,
  fossils,
  maxGeneration,
  infiniteFossilsEnabled,
  onAddFossil,
  onToggleBag,
  onRevive,
  readOnly = false,
}) => {
  const { t } = useTranslation();
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

  const canRevive =
    fossils.every((list) => list.some((f) => f.inBag && !f.revived)) &&
    selections.every((idx) => idx !== -1);

  const handleReviveClick = () => {
    if (!canRevive) return;
    onRevive(selections);
    setSelections(playerNames.map(() => -1));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="flex justify-center items-center p-2 bg-gray-800 dark:bg-gray-900">
        <h2 className="text-center text-white font-press-start text-sm">
          {t("tracker.infoPanel.fossilTracker")}
        </h2>
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
                    className="p-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    <FiPlus size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1 px-1">
                {fossils[pIdx]?.map((entry, fIdx) => {
                  const def = FOSSILS.find((f) => f.id === entry.fossilId);
                  const isSelected = selections[pIdx] === fIdx;
                  const canBeSelected = entry.inBag && !entry.revived;

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
                            : !entry.inBag
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
                      {!entry.inBag && !entry.revived && !readOnly && (
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
        onAdd={(id, loc, bag) => {
          onAddFossil(modalOpen.playerIndex, id, loc, bag);
          setModalOpen({ open: false, playerIndex: 0 });
        }}
      />
    </div>
  );
};

export default FossilTracker;
