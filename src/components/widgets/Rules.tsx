import React, { useEffect, useState } from "react";
import { FiEdit, FiPlus, FiSave, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  focusRingClasses,
  focusRingInputClasses,
  focusRingTightClasses,
} from "@/src/styles/focusRing.ts";

interface RulesProps {
  rules: string[];
  onRulesChange: (rules: string[]) => void;
  readOnly: boolean;
}

const Rules: React.FC<RulesProps> = ({ rules, onRulesChange, readOnly }) => {
  const { t } = useTranslation();
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [draftRules, setDraftRules] = useState<string[]>(rules);

  useEffect(() => {
    if (!isEditingRules) {
      setDraftRules(rules);
    }
  }, [rules, isEditingRules]);

  useEffect(() => {
    if (readOnly) {
      setIsEditingRules(false);
      setDraftRules(rules);
    }
  }, [readOnly, rules]);

  const startEditRules = () => {
    if (readOnly) return;
    setDraftRules(rules);
    setIsEditingRules(true);
  };
  const cancelEditRules = () => {
    setIsEditingRules(false);
    setDraftRules(rules);
  };
  const saveEditRules = () => {
    if (readOnly) return;
    const cleaned = draftRules
      .map((rule) => rule.trim())
      .filter((rule) => rule.length > 0);
    onRulesChange(cleaned);
    setIsEditingRules(false);
  };
  const addNewRule = () => {
    if (readOnly) return;
    setDraftRules((prev) => [...prev, ""]);
  };
  const removeRule = (index: number) => {
    if (readOnly) return;
    setDraftRules((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="relative">
        <h2
          className="text-center p-2 text-white font-press-start text-sm"
          style={{ backgroundColor: "#34a853" }}
        >
          {t("tracker.infoPanel.rules")}
        </h2>
        {!readOnly && (
          <>
            {!isEditingRules ? (
              <button
                type="button"
                onClick={startEditRules}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
                title={t("tracker.infoPanel.editRules")}
              >
                <FiEdit size={14} />
              </button>
            ) : (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditRules}
                  className={`p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
                  title={t("tracker.infoPanel.cancelRules")}
                >
                  <FiX size={14} />
                </button>
                <button
                  type="button"
                  onClick={saveEditRules}
                  className={`p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 ring-2 ring-white/25 ${focusRingTightClasses}`}
                  title={t("tracker.infoPanel.saveRules")}
                >
                  <FiSave size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {!isEditingRules ? (
        <ul className="p-4 space-y-2 text-xs list-decimal list-inside text-gray-700 dark:text-gray-300">
          {rules.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      ) : (
        <div className="p-4 space-y-2">
          {draftRules.map((rule, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 w-4 text-right">
                {index + 1}.
              </span>
              <input
                type="text"
                value={rule}
                onChange={(event) =>
                  setDraftRules((prev) =>
                    prev.map((entry, i) =>
                      i === index ? event.target.value : entry,
                    ),
                  )
                }
                placeholder={t("tracker.infoPanel.rulePlaceholder", {
                  index: index + 1,
                })}
                className={`grow px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  disabled={draftRules.length <= 1}
                  className={`self-center inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClasses}`}
                  aria-label={
                    draftRules.length <= 1
                      ? `${t("tracker.infoPanel.removeRule", {
                          index: index + 1,
                        })} - ${t("tracker.infoPanel.removeRuleDisabled")}`
                      : t("tracker.infoPanel.removeRule", {
                          index: index + 1,
                        })
                  }
                  title={
                    draftRules.length <= 1
                      ? t("tracker.infoPanel.removeRuleDisabled")
                      : t("tracker.infoPanel.removeRuleTitle")
                  }
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <div className="pt-2">
              <button
                type="button"
                onClick={addNewRule}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
                title={t("tracker.infoPanel.newRule")}
              >
                <FiPlus size={14} /> {t("tracker.infoPanel.newRule")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rules;
