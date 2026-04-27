import React, { useEffect, useId, useState } from "react";
import type { Pokemon } from "@/types.ts";
import {
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing.ts";
import { useTranslation } from "react-i18next";
import LocationSuggestionInput from "@/src/components/inputs/LocationSuggestionInput.tsx";
import PokemonSuggestionInput from "@/src/components/inputs/PokemonSuggestionInput.tsx";
import { useFocusTrap } from "@/src/hooks/useFocusTrap.ts";

interface EditPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { route: string; members: Pokemon[] }) => void;
  playerLabels: string[];
  mode?: "create" | "edit";
  initial: {
    route: string;
    members: Pokemon[];
  };
  generationLimit?: number;
  gameVersionId?: string;
  generationSpritePath?: string | null;
}

interface PokemonFieldProps {
  label: string;
  value: string;
  nickname: string;
  onNameChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  isOpen: boolean;
  generationLimit?: number;
  generationSpritePath?: string | null;
}

const PokemonField: React.FC<PokemonFieldProps> = ({
  label,
  value,
  nickname,
  onNameChange,
  onNicknameChange,
  isOpen,
  generationLimit,
  generationSpritePath,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <PokemonSuggestionInput
        label={
          <span className="inline-block min-h-[2.5rem] leading-tight whitespace-normal break-words">
            {label} - {t("modals.editPair.pokemonLabel")}
          </span>
        }
        value={value}
        onChange={onNameChange}
        isOpen={isOpen}
        generationLimit={generationLimit}
        generationSpritePath={generationSpritePath}
      />
      <label className="block text-xs text-gray-600 dark:text-gray-400">
        {t("modals.editPair.nicknameLabel")}{" "}
        <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
        placeholder={t("modals.editPair.nicknamePlaceholder")}
        required
      />
    </div>
  );
};

const EditPairModal: React.FC<EditPairModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerLabels,
  initial,
  mode = "edit",
  generationLimit,
  gameVersionId,
  generationSpritePath,
}) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const titleId = useId();
  const [route, setRoute] = useState(initial.route || "");
  const [members, setMembers] = useState<Pokemon[]>(() =>
    playerLabels.map(
      (_, index) => initial.members?.[index] ?? { name: "", nickname: "" },
    ),
  );

  useEffect(() => {
    if (isOpen) {
      setRoute(initial.route || "");
      setMembers(
        playerLabels.map(
          (_, index) => initial.members?.[index] ?? { name: "", nickname: "" },
        ),
      );
    }
  }, [isOpen, initial, playerLabels]);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    const trimmedRoute = route.trim();
    const trimmedMembers = playerLabels.map((_, index) => ({
      name: members[index]?.name.trim() ?? "",
      nickname: members[index]?.nickname.trim() ?? "",
    }));
    if (
      !trimmedRoute ||
      trimmedMembers.some(
        (member) => member.name.length === 0 || member.nickname.length === 0,
      )
    ) {
      return;
    }
    onSave({
      route: trimmedRoute,
      members: trimmedMembers,
    });
  };

  const title =
    mode === "create"
      ? t("modals.editPair.addTitle")
      : t("modals.editPair.editTitle");
  const cancelLabel = mode === "create" ? t("common.back") : t("common.cancel");
  const submitLabel = mode === "create" ? t("common.add") : t("common.save");
  const isValid =
    route.trim().length > 0 &&
    playerLabels.every((_, index) => {
      const member = members[index];
      return Boolean(member?.name.trim()) && Boolean(member?.nickname.trim());
    });
  const useTwoColumnLayout = playerLabels.length > 1;
  const gridClasses = useTwoColumnLayout
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 gap-4";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-xl font-bold dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <LocationSuggestionInput
              label={t("modals.addLost.routeLabel")}
              value={route}
              onChange={setRoute}
              isOpen={isOpen}
              gameVersionId={gameVersionId}
            />
          </div>

          <div className={gridClasses}>
            {playerLabels.map((label, index) => {
              const shouldStretchFullWidth =
                playerLabels.length % 2 === 1 &&
                index === playerLabels.length - 1;
              return (
                <div
                  key={`player-field-${index}`}
                  className={
                    shouldStretchFullWidth && useTwoColumnLayout
                      ? "md:col-span-2"
                      : undefined
                  }
                >
                  <PokemonField
                    label={label}
                    value={members[index]?.name ?? ""}
                    nickname={members[index]?.nickname ?? ""}
                    onNameChange={(value) =>
                      setMembers((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], name: value };
                        return next;
                      })
                    }
                    onNicknameChange={(value) =>
                      setMembers((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], nickname: value };
                        return next;
                      })
                    }
                    isOpen={isOpen}
                    generationLimit={generationLimit}
                    generationSpritePath={generationSpritePath}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`px-4 py-2 rounded-md font-semibold shadow ${isValid ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"} ${focusRingClasses}`}
              aria-disabled={!isValid}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPairModal;
