import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCopy, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import type { Ruleset } from "@/types";
import type { SaveRulesetPayload } from "@/src/services/rulesets";
import { useTranslation } from "react-i18next";
import {
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing";
import { DEFAULT_RULES } from "@/src/data/rulesets";
import RulesetPicker from "./RulesetPicker";

interface RulesetEditorPageProps {
  rulesets: Ruleset[];
  onBack: () => void;
  onSave: (payload: SaveRulesetPayload) => Promise<Ruleset>;
  onDelete: (rulesetId: string) => Promise<void>;
  defaultRulesetId?: string;
}

const RulesetEditorPage: React.FC<RulesetEditorPageProps> = ({
  rulesets,
  onBack,
  onSave,
  onDelete,
  defaultRulesetId,
}) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(
    defaultRulesetId || rulesets[0]?.id || "",
  );
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftRules, setDraftRules] = useState<string[]>(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRuleset = useMemo(
    () => rulesets.find((entry) => entry.id === selectedId),
    [rulesets, selectedId],
  );
  const isPreset = Boolean(selectedRuleset?.isPreset);

  const applyDraftFrom = useCallback(
    (source?: Partial<Ruleset> | null, copyName: boolean = false) => {
      const normalizedRules =
        Array.isArray(source?.rules) && source.rules.length > 0
          ? [...source.rules]
          : [""];
      setDraftName(
        copyName && source?.name
          ? `${source.name} (${t("rulesetEditor.copySuffix")})`
          : source?.name || "",
      );
      setDraftDescription(source?.description || "");
      setDraftRules(normalizedRules);
      setMessage(null);
      setError(null);
    },
    [t],
  );

  useEffect(() => {
    if (!selectedRuleset || selectedId === "new") return;
    applyDraftFrom(selectedRuleset);
  }, [selectedRuleset, selectedId, applyDraftFrom]);

  useEffect(() => {
    if (
      selectedId === "new" ||
      rulesets.find((entry) => entry.id === selectedId)
    ) {
      return;
    }
    const fallbackId = defaultRulesetId || rulesets[0]?.id || "";
    setSelectedId(fallbackId);
    const fallbackRuleset = rulesets.find((entry) => entry.id === fallbackId);
    applyDraftFrom(fallbackRuleset);
  }, [rulesets, selectedId, defaultRulesetId, applyDraftFrom]);

  const handleAddRule = () => {
    setDraftRules((prev) => [...prev, ""]);
  };

  const handleRuleChange = (index: number, value: string) => {
    setDraftRules((prev) =>
      prev.map((entry, i) => (i === index ? value : entry)),
    );
  };

  const handleRuleRemove = (index: number) => {
    setDraftRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await onSave({
        id: !isPreset && selectedRuleset ? selectedRuleset.id : undefined,
        name: draftName,
        description: draftDescription,
        rules: draftRules,
      });
      if (result?.id) {
        setSelectedId(result.id);
      }
      setMessage(t("rulesetEditor.saveSuccess"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("rulesetEditor.saveError");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRuleset || selectedRuleset.isPreset) return;
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await onDelete(selectedRuleset.id);
      const fallbackId = defaultRulesetId || rulesets[0]?.id || "";
      setSelectedId(fallbackId);
      const fallbackRuleset = rulesets.find((entry) => entry.id === fallbackId);
      applyDraftFrom(fallbackRuleset);
      setMessage(t("rulesetEditor.deleteSuccess"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("rulesetEditor.deleteError");
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleStartNew = (template?: Ruleset) => {
    setSelectedId("new");
    applyDraftFrom(
      template ?? { rules: [""], name: "", description: "" },
      Boolean(template),
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-3 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
              title={t("common.back")}
            >
              <FiArrowLeft /> {t("common.back")}
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-600">
                {t("rulesetEditor.badge")}
              </p>
              <h1 className="text-xl sm:text-3xl font-press-start text-gray-900 dark:text-gray-100 mt-2">
                {t("rulesetEditor.title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t("rulesetEditor.subtitle")}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                {t("rulesetEditor.listTitle")}
              </h2>
              <button
                type="button"
                onClick={() => handleStartNew()}
                className={`inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
              >
                <FiPlus /> {t("rulesetEditor.new")}
              </button>
            </div>
            <RulesetPicker
              value={selectedId}
              rulesets={rulesets}
              onSelect={(id) => setSelectedId(id)}
            />
            {selectedRuleset && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRuleset.isPreset
                    ? t("rulesetEditor.presetLocked")
                    : t("rulesetEditor.customHint")}
                </p>
                <button
                  type="button"
                  onClick={() => handleStartNew(selectedRuleset)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                >
                  <FiCopy size={14} /> {t("rulesetEditor.copy")}
                </button>
              </div>
            )}
          </section>

          <section className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                {t("rulesetEditor.formTitle")}
              </h2>
              {isPreset && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t("rulesetEditor.readonlyInfo")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  {t("rulesetEditor.name")}
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  disabled={isPreset}
                  className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 disabled:opacity-60 ${focusRingInputClasses}`}
                  placeholder={t("rulesetEditor.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  {t("rulesetEditor.description")}
                </label>
                <input
                  type="text"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  disabled={isPreset}
                  className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 disabled:opacity-60 ${focusRingInputClasses}`}
                  placeholder={t("rulesetEditor.descriptionPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {t("rulesetEditor.rulesTitle")}
                </h3>
                {!isPreset && (
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className={`inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                  >
                    <FiPlus /> {t("rulesetEditor.addRule")}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {draftRules.map((rule, index) => (
                  <div
                    key={`${index}-${selectedId}`}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 w-5 text-right">
                      {index + 1}.
                    </span>
                    <textarea
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      disabled={isPreset}
                      rows={2}
                      className={`flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60 ${focusRingInputClasses}`}
                      placeholder={t("rulesetEditor.rulePlaceholder", {
                        index: index + 1,
                      })}
                    />
                    {!isPreset && (
                      <button
                        type="button"
                        onClick={() => handleRuleRemove(index)}
                        className={`mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${focusRingClasses}`}
                        aria-label={t("rulesetEditor.removeRule", {
                          index: index + 1,
                        })}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-md border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-3 py-2 text-sm text-green-700 dark:text-green-200">
                {message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {!isPreset && selectedRuleset && selectedRuleset.id !== "new" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white dark:bg-gray-800 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-60"
                >
                  <FiTrash2 />{" "}
                  {deleting
                    ? t("rulesetEditor.deleting")
                    : t("rulesetEditor.delete")}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || isPreset}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
              >
                <FiSave />
                {saving ? t("rulesetEditor.saving") : t("rulesetEditor.save")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RulesetEditorPage;
