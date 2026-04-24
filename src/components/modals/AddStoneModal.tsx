import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { STONES } from "@/src/data/stones.ts";
import { FiX, FiInfo } from "react-icons/fi";
import LocationSuggestionInput from "../inputs/LocationSuggestionInput.tsx";
import Tooltip from "@/src/components/other/Tooltip.tsx";
import { useFocusTrap } from "@/src/hooks/useFocusTrap.ts";
import {
  focusRingCardClasses,
  focusRingClasses,
} from "@/src/styles/focusRing.ts";

interface AddStoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stoneId: string, location: string, inBag: boolean) => void;
  maxGeneration: number;
  alreadyOwnedIds: string[];
  gameVersionId?: string;
}

const AddStoneModal: React.FC<AddStoneModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  maxGeneration,
  gameVersionId,
}) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const [selectedStoneId, setSelectedStoneId] = useState("");
  const [location, setLocation] = useState("");
  const [inBag, setInBag] = useState(true);

  const availableStones = useMemo(() => {
    return STONES.filter((s) => s.gen <= maxGeneration);
  }, [maxGeneration]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!selectedStoneId) return;
    onAdd(selectedStoneId, inBag ? "" : location, inBag);
    setSelectedStoneId("");
    setLocation("");
    setInBag(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">
            {t("modals.addStone.title")}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t("modals.addStone.stoneLabel")}
            </label>

            {availableStones.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 p-1">
                {availableStones.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStoneId(s.id)}
                    className={`flex flex-col items-center p-2 rounded-md border transition-all ${focusRingCardClasses} ${
                      selectedStoneId === s.id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <img
                      src={`/stone-sprites/${s.sprite}`}
                      alt={s.id}
                      className="w-10 h-10 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className="text-[10px] mt-1 text-center dark:text-gray-200">
                      {t(`stones.${s.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                {t("modals.addStone.emptyListExplanation")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="stoneInBag"
              checked={inBag}
              onChange={(e) => {
                setInBag(e.target.checked);
                if (e.target.checked) setLocation("");
              }}
              disabled={availableStones.length === 0}
              className="h-4 w-4 accent-green-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <label
              htmlFor="stoneInBag"
              className={`text-sm font-semibold dark:text-gray-200 cursor-pointer ${
                availableStones.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {t("modals.addStone.inBagLabel")}
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                {t("modals.addStone.locationLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Tooltip
                side="top"
                content={t("modals.addStone.locationTooltip")}
              >
                <span
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help"
                  aria-label={t("modals.addStone.locationTooltipLabel")}
                >
                  <FiInfo size={16} />
                </span>
              </Tooltip>
            </div>
            <LocationSuggestionInput
              label=""
              value={inBag ? "" : location}
              onChange={setLocation}
              isOpen={isOpen}
              gameVersionId={gameVersionId}
              disabled={inBag || availableStones.length === 0}
              placeholder={inBag ? "" : t("common.routePlaceholder")}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!selectedStoneId || (!inBag && !location.trim())}
              className={`px-4 py-2 rounded-md font-semibold shadow ${focusRingClasses} ${
                selectedStoneId && (inBag || location.trim())
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("modals.addStone.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoneModal;
