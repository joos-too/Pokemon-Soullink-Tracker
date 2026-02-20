import React, { useId } from "react";
import { FiAlertTriangle, FiRefreshCw, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { focusRingClasses } from "@/src/styles/focusRing";
import { useFocusTrap } from "@/src/hooks/useFocusTrap";

interface RulesetSyncModalProps {
  isOpen: boolean;
  rulesetName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const RulesetSyncModal: React.FC<RulesetSyncModalProps> = ({
  isOpen,
  rulesetName,
  onClose,
  onConfirm,
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
              {t("settings.rulesets.syncModal.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
            aria-label={t("settings.rulesets.syncModal.cancel")}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {t("settings.rulesets.syncModal.description", { rulesetName })}
          </p>
          <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-100">
            <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{t("settings.rulesets.syncModal.warning")}</span>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-semibold shadow ${focusRingClasses}`}
          >
            <FiRefreshCw />
            {t("settings.rulesets.syncModal.confirm")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
          >
            {t("settings.rulesets.syncModal.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesetSyncModal;
