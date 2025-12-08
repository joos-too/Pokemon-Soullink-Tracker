import React from "react";
import type { Ruleset } from "@/types";
import { focusRingClasses } from "@/src/styles/focusRing";
import { FiLock, FiUser } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface RulesetPickerProps {
  value: string;
  rulesets: Ruleset[];
  onSelect: (rulesetId: string) => void;
  isInteractive?: boolean;
}

const RulesetPicker: React.FC<RulesetPickerProps> = ({
  value,
  rulesets,
  onSelect,
  isInteractive = true,
}) => {
  const { t } = useTranslation();

  if (!rulesets.length) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300 px-1 py-2">
        {t("rulesets.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
      {rulesets.map((ruleset) => {
        const selected = ruleset.id === value;
        const badgeIcon = ruleset.isPreset ? (
          <FiLock size={12} />
        ) : (
          <FiUser size={12} />
        );
        return (
          <button
            key={ruleset.id}
            type="button"
            onClick={() => onSelect(ruleset.id)}
            disabled={!isInteractive}
            className={`w-full text-left rounded-md border px-3 py-2 transition ${selected ? "border-green-500 bg-green-50 dark:border-green-500/80 dark:bg-green-900/20 shadow-sm" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"} disabled:opacity-60 disabled:cursor-not-allowed ${focusRingClasses}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {ruleset.name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${ruleset.isPreset ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"}`}
                  >
                    {badgeIcon}
                    {ruleset.isPreset
                      ? t("rulesets.presetTag")
                      : t("rulesets.customTag")}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {ruleset.description || t("rulesets.noDescription")}
                </p>
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {t("rulesets.ruleCount", { count: ruleset.rules.length })}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default RulesetPicker;
