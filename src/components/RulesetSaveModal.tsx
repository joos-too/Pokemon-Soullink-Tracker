import React, { useId } from "react";
import { FiAlertTriangle, FiCopy, FiSave, FiX } from "react-icons/fi";
import type { Ruleset } from "@/types";
import { useTranslation } from "react-i18next";
import { focusRingClasses } from "@/src/styles/focusRing";
import { useFocusTrap } from "@/src/hooks/useFocusTrap";

interface RulesetSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSave: (mode: "copy" | "overwrite") => void;
  isLoading: boolean;
  error: string | null;
  reason: "switch" | "manual";
  currentRuleset?: Ruleset | null;
  hasUserRulesetWithSameId: boolean;
  rulesetCopyName: string;
  rulesetOverwriteName: string;
}

const RulesetSaveModal: React.FC<RulesetSaveModalProps> = ({
  isOpen,
  onClose,
  onSkip,
  onSave,
  isLoading,
  error,
  reason,
  currentRuleset,
  hasUserRulesetWithSameId,
  rulesetCopyName,
  rulesetOverwriteName,
}) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">
              {t("settings.rulesets.label")}
            </p>
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {reason === "switch"
                ? t("settings.rulesets.saveModal.switchTitle")
                : t("settings.rulesets.saveModal.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
            aria-label={t("settings.rulesets.saveModal.cancel")}
            disabled={isLoading}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <FiAlertTriangle
              className="mt-0.5 text-amber-500 shrink-0"
              size={18}
            />
            <span>
              {reason === "switch"
                ? t("settings.rulesets.saveModal.switchBody")
                : t("settings.rulesets.saveModal.description")}
            </span>
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {currentRuleset?.isPreset ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onSave("copy")}
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-60 ${focusRingClasses}`}
              >
                <FiCopy />
                {isLoading
                  ? t("settings.rulesets.saveModal.saving")
                  : t("settings.rulesets.saveModal.copyButton", {
                      name: rulesetCopyName,
                    })}
              </button>
            </div>
          ) : hasUserRulesetWithSameId ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onSave("overwrite")}
                  disabled={isLoading}
                  className={`grow inline-flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-60 ${focusRingClasses}`}
                >
                  <FiSave />
                  {isLoading
                    ? t("settings.rulesets.saveModal.saving")
                    : t("settings.rulesets.saveModal.overwriteButton", {
                        name: rulesetOverwriteName,
                      })}
                </button>
                <button
                  type="button"
                  onClick={() => onSave("copy")}
                  disabled={isLoading}
                  className={`grow inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm font-semibold shadow-sm disabled:opacity-60 ${focusRingClasses}`}
                >
                  <FiCopy />
                  {t("settings.rulesets.saveModal.copyButton", {
                    name: rulesetCopyName,
                  })}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onSave("overwrite")}
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-60 ${focusRingClasses}`}
            >
              <FiSave />
              {isLoading
                ? t("settings.rulesets.saveModal.saving")
                : t("settings.rulesets.saveModal.primary")}
            </button>
          )}

          {reason === "switch" && (
            <button
              type="button"
              onClick={onSkip}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm font-semibold shadow-sm ${focusRingClasses}`}
            >
              {t("settings.rulesets.saveModal.skip")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 ${focusRingClasses}`}
            disabled={isLoading}
          >
            {t("settings.rulesets.saveModal.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesetSaveModal;
