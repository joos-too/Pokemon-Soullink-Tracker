import React, { useId } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "@/src/hooks/useFocusTrap";
import { focusRingClasses } from "@/src/styles/focusRing";

interface DeleteTrackerModalProps {
  isOpen: boolean;
  trackerTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error?: string | null;
}

const DeleteTrackerModal: React.FC<DeleteTrackerModalProps> = ({
  isOpen,
  trackerTitle,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}) => {
  const { t } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">
              {t("modals.deleteTracker.badge")}
            </p>
            <h2
              id={titleId}
              className="text-xl font-semibold mt-1 text-gray-900 dark:text-gray-100"
            >
              {trackerTitle ?? t("modals.deleteTracker.untitled")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
            aria-label={t("common.close")}
            disabled={isDeleting}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-900 dark:text-red-100">
            {t("modals.deleteTracker.confirm")}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("modals.deleteTracker.warning")}
          </p>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 px-3 py-2 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-gray-200 dark:border-gray-700 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className={`inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 ${focusRingClasses}`}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-60"
          >
            <FiTrash2 />
            {isDeleting
              ? t("modals.deleteTracker.deleting")
              : t("modals.deleteTracker.submit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTrackerModal;
