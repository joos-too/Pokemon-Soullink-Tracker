import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FossilEntry, StoneEntry } from "@/types";
import { FOSSILS, STONES, PLAYER_COLORS } from "@/src/services/init";
import {
  FiPlus,
  FiCheck,
  FiEdit,
  FiSave,
  FiX,
  FiRefreshCw,
  FiZap,
} from "react-icons/fi";
import AddFossilModal from "./AddFossilModal";
import AddStoneModal from "./AddStoneModal";
import {
  focusRingCardClasses,
  focusRingClasses,
  focusRingRedClasses,
  focusRingTightClasses,
} from "@/src/styles/focusRing";

interface FossilTrackerProps {
  playerNames: string[];
  fossils: FossilEntry[][];
  stones: StoneEntry[][];
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
  onUpdateFossils: (newFossils: FossilEntry[][]) => void;
  onAddStone: (
    playerIndex: number,
    stoneId: string,
    location: string,
    inBag: boolean,
  ) => void;
  onToggleStoneBag: (playerIndex: number, stoneIndex: number) => void;
  onUseStone: (playerIndex: number, stoneIndex: number) => void;
  onUpdateStones: (newStones: StoneEntry[][]) => void;
  readOnly?: boolean;
  gameVersionId?: string;
}

const FossilTracker: React.FC<FossilTrackerProps> = ({
  playerNames,
  fossils,
  stones,
  maxGeneration,
  infiniteFossilsEnabled,
  onAddFossil,
  onToggleBag,
  onRevive,
  onUpdateFossils,
  onAddStone,
  onToggleStoneBag,
  onUseStone,
  onUpdateStones,
  readOnly = false,
  gameVersionId,
}) => {
  const { t } = useTranslation();
  const [showStones, setShowStones] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- Fossil state ---
  const [isFossilEditing, setIsFossilEditing] = useState(false);
  const [draftFossils, setDraftFossils] = useState<FossilEntry[][]>([]);
  const [fossilModalOpen, setFossilModalOpen] = useState<{
    open: boolean;
    playerIndex: number;
  }>({ open: false, playerIndex: 0 });
  const [fossilSelections, setFossilSelections] = useState<number[]>(
    playerNames.map(() => -1),
  );

  // --- Stone state ---
  const [isStoneEditing, setIsStoneEditing] = useState(false);
  const [draftStones, setDraftStones] = useState<StoneEntry[][]>([]);
  const [stoneModalOpen, setStoneModalOpen] = useState<{
    open: boolean;
    playerIndex: number;
  }>({ open: false, playerIndex: 0 });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mql.removeEventListener(
        "change",
        handler as (e: MediaQueryListEvent) => void,
      );
  }, []);

  // --- Fossil helpers ---
  const startFossilEditing = () => {
    setDraftFossils(JSON.parse(JSON.stringify(fossils)));
    setIsFossilEditing(true);
  };
  const cancelFossilEditing = () => {
    setIsFossilEditing(false);
    setDraftFossils([]);
  };
  const saveFossilEditing = () => {
    onUpdateFossils(draftFossils);
    setIsFossilEditing(false);
  };
  const deleteFossil = (pIdx: number, fIdx: number) => {
    setDraftFossils((prev) => {
      const next = [...prev];
      next[pIdx] = next[pIdx].filter((_, i) => i !== fIdx);
      return next;
    });
  };
  const displayFossils = isFossilEditing ? draftFossils : fossils;
  const canRevive =
    !isFossilEditing &&
    displayFossils.every((list) => list.some((f) => f.inBag && !f.revived)) &&
    fossilSelections.every((idx) => idx !== -1);
  const handleReviveClick = () => {
    if (!canRevive) return;
    onRevive(fossilSelections);
    setFossilSelections(playerNames.map(() => -1));
  };

  // --- Stone helpers ---
  const startStoneEditing = () => {
    setDraftStones(JSON.parse(JSON.stringify(stones)));
    setIsStoneEditing(true);
  };
  const cancelStoneEditing = () => {
    setIsStoneEditing(false);
    setDraftStones([]);
  };
  const saveStoneEditing = () => {
    onUpdateStones(draftStones);
    setIsStoneEditing(false);
  };
  const deleteStone = (pIdx: number, sIdx: number) => {
    setDraftStones((prev) => {
      const next = [...prev];
      next[pIdx] = next[pIdx].filter((_, i) => i !== sIdx);
      return next;
    });
  };
  const displayStones = isStoneEditing ? draftStones : stones;

  const toggleFlip = () => setShowStones((prev) => !prev);

  // --- Render fossil header buttons ---
  const renderFossilHeaderButtons = () => {
    if (readOnly) return null;
    return (
      <>
        {!isFossilEditing ? (
          <button
            onClick={startFossilEditing}
            className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
            title={t("tracker.infoPanel.editFossils")}
          >
            <FiEdit size={14} />
          </button>
        ) : (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={cancelFossilEditing}
              className={`p-1 rounded-full text-red-400 hover:text-red-200 hover:bg-black/20 ring-2 ring-red-400/80 ${focusRingTightClasses}`}
            >
              <FiX size={14} />
            </button>
            <button
              onClick={saveFossilEditing}
              className={`p-1 rounded-full text-green-400 hover:text-green-200 hover:bg-black/20 ring-2 ring-green-400/80 ${focusRingTightClasses}`}
            >
              <FiSave size={14} />
            </button>
          </div>
        )}
      </>
    );
  };

  // --- Render stone header buttons ---
  const renderStoneHeaderButtons = () => {
    if (readOnly) return null;
    return (
      <>
        {!isStoneEditing ? (
          <button
            onClick={startStoneEditing}
            className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
            title={t("tracker.infoPanel.editStones")}
          >
            <FiEdit size={14} />
          </button>
        ) : (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={cancelStoneEditing}
              className={`p-1 rounded-full text-red-400 hover:text-red-200 hover:bg-black/20 ring-2 ring-red-400/80 ${focusRingTightClasses}`}
            >
              <FiX size={14} />
            </button>
            <button
              onClick={saveStoneEditing}
              className={`p-1 rounded-full text-green-400 hover:text-green-200 hover:bg-black/20 ring-2 ring-green-400/80 ${focusRingTightClasses}`}
            >
              <FiSave size={14} />
            </button>
          </div>
        )}
      </>
    );
  };

  // --- Render fossil content ---
  const renderFossilContent = () => (
    <div className="flex flex-col max-h-[350px]">
      <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
                      setFossilModalOpen({ open: true, playerIndex: pIdx })
                    }
                    disabled={isFossilEditing}
                    className={`p-1 rounded text-white transition-colors shrink-0 ${
                      isFossilEditing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } ${focusRingClasses}`}
                  >
                    <FiPlus size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1 px-1">
                {displayFossils[pIdx]?.map((entry, fIdx) => {
                  const def = FOSSILS.find((f) => f.id === entry.fossilId);
                  const isSelected = fossilSelections[pIdx] === fIdx;
                  const canBeSelected =
                    entry.inBag && !entry.revived && !isFossilEditing;
                  const isInteractive = !readOnly && canBeSelected;

                  return (
                    <div
                      key={`${pIdx}-${entry.fossilId}-${fIdx}`}
                      onClick={() => {
                        if (!isInteractive) return;
                        setFossilSelections((prev) => {
                          const next = [...prev];
                          next[pIdx] = next[pIdx] === fIdx ? -1 : fIdx;
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (!isInteractive) return;
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        setFossilSelections((prev) => {
                          const next = [...prev];
                          next[pIdx] = next[pIdx] === fIdx ? -1 : fIdx;
                          return next;
                        });
                      }}
                      role={isInteractive ? "button" : undefined}
                      aria-pressed={isInteractive ? isSelected : undefined}
                      tabIndex={isInteractive ? 0 : -1}
                      className={`flex items-center gap-2 p-1.5 rounded border text-[10px] transition-all ${
                        entry.revived
                          ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 cursor-default"
                          : isSelected
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500 cursor-pointer"
                            : !entry.inBag && !isFossilEditing
                              ? "border-gray-200 dark:border-gray-700 opacity-60 cursor-default"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 cursor-pointer"
                      } ${isInteractive ? focusRingCardClasses : ""}`}
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

                      {isFossilEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFossil(pIdx, fIdx);
                          }}
                          className={`p-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 shrink-0 ${focusRingRedClasses}`}
                        >
                          <FiX size={12} />
                        </button>
                      )}

                      {!isFossilEditing &&
                        !entry.inBag &&
                        !entry.revived &&
                        !readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBag(pIdx, fIdx);
                            }}
                            className="p-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 shrink-0"
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
      </div>

      {!readOnly && (
        <div className="p-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReviveClick}
            disabled={!canRevive}
            className={`w-full py-2 rounded-md font-press-start text-[10px] shadow-sm transition-all ${
              canRevive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
            } ${focusRingRedClasses}`}
          >
            {t("tracker.infoPanel.fossilRevive")}
          </button>
        </div>
      )}
    </div>
  );

  // --- Render stone content ---
  const renderStoneContent = () => (
    <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
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
          <div key={`stone-player-${pIdx}`} className="space-y-2">
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
                    setStoneModalOpen({ open: true, playerIndex: pIdx })
                  }
                  disabled={isStoneEditing}
                  className={`p-1 rounded text-white transition-colors shrink-0 ${
                    isStoneEditing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } ${focusRingClasses}`}
                >
                  <FiPlus size={14} />
                </button>
              )}
            </div>

            <div className="space-y-1 px-1">
              {displayStones[pIdx]?.map((entry, sIdx) => {
                const def = STONES.find((s) => s.id === entry.stoneId);

                return (
                  <div
                    key={`${pIdx}-${entry.stoneId}-${sIdx}`}
                    className={`flex items-center gap-2 p-1.5 rounded border text-[10px] transition-all ${
                      entry.used
                        ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : !entry.inBag && !isStoneEditing
                          ? "border-gray-200 dark:border-gray-700 opacity-60"
                          : "border-gray-200 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <img
                      src={`/stone-sprites/${def?.sprite}`}
                      alt=""
                      className={`w-6 h-6 object-contain ${entry.used ? "grayscale-[0.5]" : ""}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">
                        {t(`stones.${entry.stoneId}`)}
                      </div>
                      <div className="opacity-70 truncate">
                        {entry.used
                          ? t("tracker.infoPanel.stoneUsed")
                          : entry.inBag
                            ? t("tracker.infoPanel.stoneBag")
                            : t("tracker.infoPanel.stoneLocation", {
                                location: entry.location,
                              })}
                      </div>
                    </div>

                    {isStoneEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStone(pIdx, sIdx);
                        }}
                        className={`p-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 shrink-0 ${focusRingRedClasses}`}
                      >
                        <FiX size={12} />
                      </button>
                    )}

                    {/* Move to bag button */}
                    {!isStoneEditing &&
                      !entry.inBag &&
                      !entry.used &&
                      !readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStoneBag(pIdx, sIdx);
                          }}
                          className="p-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 shrink-0"
                          title={t("tracker.infoPanel.stoneBag")}
                        >
                          <FiCheck size={12} />
                        </button>
                      )}

                    {/* Use stone button — per-player, directly on the card */}
                    {!isStoneEditing &&
                      entry.inBag &&
                      !entry.used &&
                      !readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUseStone(pIdx, sIdx);
                          }}
                          className={`p-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 shrink-0 ${focusRingRedClasses}`}
                          title={t("tracker.infoPanel.stoneUse")}
                        >
                          <FiZap size={12} />
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        {/* Header */}
        <div className="relative shrink-0">
          <h2
            className="text-center p-2 text-white font-press-start text-sm transition-colors duration-500"
            style={{
              backgroundColor: showStones ? "#d38442" : "#2c7b90",
            }}
          >
            {showStones
              ? t("tracker.infoPanel.stoneTracker")
              : t("tracker.infoPanel.fossilTracker")}
          </h2>
          {showStones
            ? renderStoneHeaderButtons()
            : renderFossilHeaderButtons()}
          <button
            onClick={toggleFlip}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
            title={
              showStones
                ? t("tracker.infoPanel.flipToFossils")
                : t("tracker.infoPanel.flipToStones")
            }
          >
            <FiRefreshCw
              size={14}
              className={`transition-transform duration-500 ${showStones ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Content with flip animation */}
        {isMobile ? (
          showStones ? (
            renderStoneContent()
          ) : (
            renderFossilContent()
          )
        ) : (
          <div
            className="transition-transform duration-700"
            style={{
              display: "grid",
              transformStyle: "preserve-3d",
              transform: showStones ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className={`${showStones ? "pointer-events-none invisible" : "pointer-events-auto"}`}
              aria-hidden={showStones}
              style={{
                gridArea: "1 / 1",
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              {renderFossilContent()}
            </div>

            <div
              className={`${showStones ? "pointer-events-auto" : "pointer-events-none invisible"}`}
              aria-hidden={!showStones}
              style={{
                gridArea: "1 / 1",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {renderStoneContent()}
            </div>
          </div>
        )}
      </div>

      {/* Modals rendered outside the tracker to avoid clipping/containment issues */}
      <AddFossilModal
        isOpen={fossilModalOpen.open}
        onClose={() => setFossilModalOpen({ open: false, playerIndex: 0 })}
        maxGeneration={maxGeneration}
        alreadyOwnedIds={
          fossils[fossilModalOpen.playerIndex]?.map((f) => f.fossilId) || []
        }
        infiniteFossilsEnabled={infiniteFossilsEnabled}
        gameVersionId={gameVersionId}
        onAdd={(id, loc, bag) => {
          onAddFossil(fossilModalOpen.playerIndex, id, loc, bag);
          setFossilModalOpen({ open: false, playerIndex: 0 });
        }}
      />
      <AddStoneModal
        isOpen={stoneModalOpen.open}
        onClose={() => setStoneModalOpen({ open: false, playerIndex: 0 })}
        maxGeneration={maxGeneration}
        alreadyOwnedIds={
          stones[stoneModalOpen.playerIndex]?.map((s) => s.stoneId) || []
        }
        gameVersionId={gameVersionId}
        onAdd={(id, loc, bag) => {
          onAddStone(stoneModalOpen.playerIndex, id, loc, bag);
          setStoneModalOpen({ open: false, playerIndex: 0 });
        }}
      />
    </>
  );
};

export default FossilTracker;
