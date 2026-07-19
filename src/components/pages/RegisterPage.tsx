import React, { useState } from "react";
import { getAuthErrorCode, signUp } from "@/src/services/backend/auth.ts";
import {
  focusRingBlueClasses,
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing.ts";
import { useTranslation } from "react-i18next";

type RegisterPageProps = {
  onSwitchToLogin: () => void;
};

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const resolveErrorMessage = (err: unknown): string => {
    switch (getAuthErrorCode(err)) {
      case "email-already-in-use":
        return t("auth.register.errors.emailInUse");
      case "invalid-email":
        return t("auth.register.errors.invalidEmail");
      case "weak-password":
        return t("auth.register.errors.weakPassword");
      default:
        return t("auth.register.errors.general");
    }
  };

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.register.errors.weakPassword"));
      return;
    }

    const normalizedDisplayName = displayName.trim().replace(/\s+/g, " ");
    if (!normalizedDisplayName) {
      setError(t("auth.register.displayNameRequired"));
      return;
    }

    if (normalizedDisplayName.length > 50) {
      setError(t("auth.register.displayNameTooLong"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, normalizedDisplayName);
    } catch (err) {
      console.error("Error registering user", err);
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 text-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)] border border-gray-200 dark:border-gray-700 p-6 sm:p-8 rounded-lg">
          <header className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <img
              src="/Soullinktracker-Logo.png"
              alt="Soullink Tracker Logo"
              className="mx-auto mb-3 w-40 h-40 object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold font-press-start tracking-tighter dark:text-gray-100">
              {t("auth.register.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              <span className="block">{t("auth.register.headline")}</span>
              <span className="block mt-1">
                {t("auth.register.haveAccount")}{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className={`font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline focus-visible:underline ${focusRingBlueClasses}`}
                >
                  {t("auth.register.toLogin")}
                </button>
              </span>
            </p>
          </header>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="register-display-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("auth.register.displayNameLabel")}
              </label>
              <input
                id="register-display-name"
                type="text"
                autoComplete="nickname"
                required
                maxLength={50}
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder={t("auth.register.displayNamePlaceholder")}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("auth.register.displayNameInfo")}
              </p>
            </div>
            <div>
              <label
                htmlFor="register-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("auth.register.emailLabel")}
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder={t("auth.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("auth.register.passwordLabel")}
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("auth.register.confirmPasswordLabel")}
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-70 ${focusRingClasses}`}
            >
              {loading
                ? `${t("auth.register.submit")}…`
                : t("auth.register.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
