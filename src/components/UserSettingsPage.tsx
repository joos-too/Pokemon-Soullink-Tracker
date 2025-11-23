import React, { useState } from "react";
import {
  FiArrowLeft,
  FiMail,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiLogOut,
  FiInfo,
} from "react-icons/fi";
import { focusRingClasses } from "@/src/styles/focusRing";
import { requestPasswordReset } from "@/src/services/auth";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";
import Tooltip from "./Tooltip";

interface UserSettingsPageProps {
  email?: string | null;
  onBack: () => void;
  onLogout: () => void;
  useGenerationSprites?: boolean;
  onGenerationSpritesToggle: (enabled: boolean) => void;
  useSpritesInTeamTable?: boolean;
  onSpritesInTeamTableToggle: (enabled: boolean) => void;
}

const UserSettingsPage: React.FC<UserSettingsPageProps> = ({
  email,
  onBack,
  onLogout,
  useGenerationSprites,
  onGenerationSpritesToggle,
  useSpritesInTeamTable,
  onSpritesInTeamTableToggle,
}) => {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handlePasswordReset = async () => {
    if (!email) {
      setStatus("error");
      setMessage(t("userSettings.errors.noEmail"));
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setStatus("success");
      setMessage(t("userSettings.messages.resetEmailSent"));
    } catch (error) {
      const fallback =
        error instanceof Error
          ? error.message
          : t("userSettings.errors.resetFailed");
      setStatus("error");
      setMessage(fallback);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email;

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-3 py-6 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ${focusRingClasses}`}
        >
          <FiArrowLeft /> {t("userSettings.buttons.back")}
        </button>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-8 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
          <header className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">
              {t("userSettings.header.badge")}
            </p>
            <h1 className="text-2xl font-bold font-press-start text-gray-900 dark:text-gray-100 mt-3">
              {t("userSettings.header.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              {t("userSettings.header.subtitle")}
            </p>
          </header>

          <section className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
              <FiMail className="mt-1" size={20} />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  {t("userSettings.emailLabel")}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {email || "—"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t("userSettings.emailInfo")}
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={disabled}
                className={`inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed ${focusRingClasses}`}
              >
                {loading ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiRefreshCw />
                )}
                {t("userSettings.actions.resetPassword")}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("userSettings.resetDetails")}
              </p>
            </div>

            {message && (
              <div
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  status === "success"
                    ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200"
                    : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
                }`}
                role="status"
                aria-live="polite"
              >
                {status === "success" ? (
                  <FiCheckCircle className="mt-0.5" />
                ) : (
                  <FiAlertTriangle className="mt-0.5" />
                )}
                <span>{message}</span>
              </div>
            )}
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
              {t("userSettings.language.title")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("userSettings.language.description")}
            </p>
            <div className="flex justify-start">
              <LanguageToggle />
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
              {t("userSettings.sprites.title")}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {t("settings.features.generationSprites.title")}
                  </div>
                  <Tooltip
                    side="top"
                    content={t("settings.features.generationSprites.tooltip")}
                  >
                    <span
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help"
                      aria-label={t(
                        "settings.features.generationSprites.tooltipLabel",
                      )}
                    >
                      <FiInfo size={16} />
                    </span>
                  </Tooltip>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("settings.features.generationSprites.description")}
                </div>
              </div>
              <label
                htmlFor="generation-sprites-toggle"
                className="inline-flex items-center cursor-pointer rounded-full"
              >
                <input
                  type="checkbox"
                  id="generation-sprites-toggle"
                  checked={useGenerationSprites ?? false}
                  onChange={(e) => onGenerationSpritesToggle(e.target.checked)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t("settings.features.generationSprites.title")}
                />
                <span
                  aria-hidden="true"
                  className={`relative block w-11 h-6 rounded-full transition-colors duration-200 ease-out pointer-events-none ${
                    useGenerationSprites
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-out pointer-events-none ${
                      useGenerationSprites ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {t("settings.features.spritesInTeamTable.title")}
                  </div>
                  <Tooltip
                    side="top"
                    content={t("settings.features.spritesInTeamTable.tooltip")}
                  >
                    <span
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help"
                      aria-label={t(
                        "settings.features.spritesInTeamTable.tooltipLabel",
                      )}
                    >
                      <FiInfo size={16} />
                    </span>
                  </Tooltip>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("settings.features.spritesInTeamTable.description")}
                </div>
              </div>
              <label
                htmlFor="sprites-in-team-table-toggle"
                className="inline-flex items-center cursor-pointer rounded-full"
              >
                <input
                  type="checkbox"
                  id="sprites-in-team-table-toggle"
                  checked={useSpritesInTeamTable ?? false}
                  onChange={(e) => onSpritesInTeamTableToggle(e.target.checked)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t("settings.features.spritesInTeamTable.title")}
                />
                <span
                  aria-hidden="true"
                  className={`relative block w-11 h-6 rounded-full transition-colors duration-200 ease-out pointer-events-none ${
                    useSpritesInTeamTable
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-out pointer-events-none ${
                      useSpritesInTeamTable ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t("userSettings.logoutPrompt")}
            </p>
            <button
              type="button"
              onClick={onLogout}
              className={`inline-flex items-center gap-2 rounded-md border border-red-200 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 ${focusRingClasses}`}
            >
              <FiLogOut /> {t("common.logout")}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
