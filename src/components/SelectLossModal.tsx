import React, { useEffect, useId, useState } from "react";
import type { PokemonLink } from "@/types";
import { Trans, useTranslation } from "react-i18next";
import { useFocusTrap } from "@/src/hooks/useFocusTrap";
import { focusRingClasses } from "@/src/styles/focusRing.ts";
import { getSpriteUrlForPokemonName } from "@/src/services/sprites";

interface SelectLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerIndex: number) => void;
  pair: PokemonLink | null;
  playerNames: string[];
}

const SelectLossModal: React.FC<SelectLossModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pair,
  playerNames,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setSelected(playerNames.length === 1 ? 0 : null);
    }
  }, [isOpen, playerNames.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === null) return;
    onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-lg font-bold dark:text-gray-100">
            {t("modals.selectLoss.title")}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
            aria-label={t("common.close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {pair && (
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            <p className="mb-3">{t("modals.selectLoss.description")}</p>
            <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-md px-2.5 py-1.5">
              {playerNames.map((name, index) => {
                const member = pair.members?.[index] ?? {
                  name: "",
                  nickname: "",
                };
                const spriteUrl = getSpriteUrlForPokemonName(member.name);
                return (
                  <div
                    key={`loss-preview-${index}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="font-semibold">{name}</div>
                    <div className="flex items-center gap-1.5">
                      {spriteUrl && (
                        <img
                          src={spriteUrl}
                          alt={member.name}
                          className="w-8 h-8"
                        />
                      )}
                      <span>
                        {member.name || "-"}
                        {member.nickname ? ` (${member.nickname})` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              {pair.route && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("modals.selectLoss.routeLabel", { route: pair.route })}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {playerNames.length === 1 ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 border border-red-200 dark:border-red-500 rounded-md p-3 bg-red-50 dark:bg-red-900/30">
              <Trans
                i18nKey="modals.selectLoss.autoAssign"
                values={{ player: playerNames[0] }}
                components={{ strong: <span className="font-semibold" /> }}
              />
            </div>
          ) : (
            <fieldset className="flex flex-col gap-2">
              {playerNames.map((name, index) => (
                <label
                  key={`lost-player-${index}`}
                  className={`flex items-center gap-2 cursor-pointer dark:text-gray-200 rounded-md px-2 py-1 ${focusRingClasses}`}
                >
                  <input
                    type="radio"
                    name="lost-player"
                    checked={selected === index}
                    onChange={() => setSelected(index)}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="font-semibold">{name}</span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={selected === null}
              className={`px-4 py-2 rounded-md font-semibold shadow ${selected !== null ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}
            >
              {t("modals.selectLoss.confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectLossModal;
