import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { auth } from "../firebaseConfig";
import { focusRingClasses, focusRingInputClasses, focusRingBlueClasses } from "@/src/styles/focusRing";
import { useTranslation } from "react-i18next";

type RegisterPageProps = {
  onSwitchToLogin: () => void;
};

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const resolveErrorMessage = (err: unknown): string => {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as FirebaseError).code;
      switch (code) {
        case "auth/email-already-in-use":
          return t('auth.register.errors.emailInUse');
        case "auth/invalid-email":
          return t('auth.register.errors.invalidEmail');
        case "auth/weak-password":
          return t('auth.register.errors.weakPassword');
        default:
          break;
      }
    }
    return t('auth.register.errors.general');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('auth.register.errors.weakPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
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
              src="/Soullinktracker-Logo - cropped.png"
              alt="Soullink Tracker Logo"
              className="mx-auto mb-3 w-40 h-40 object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold font-press-start tracking-tighter dark:text-gray-100">
              {t('auth.register.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              <span className="block">{t('auth.register.headline')}</span>
              <span className="block mt-1">
                {t('auth.register.haveAccount')}{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className={`font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline focus-visible:underline ${focusRingBlueClasses}`}
                >
                  {t('auth.register.toLogin')}
                </button>
              </span>
            </p>
          </header>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.register.emailLabel')}
            </label>
              <input
                type="email"
                autoComplete="email"
                required
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.register.passwordLabel')}
            </label>
              <input
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.register.confirmPasswordLabel')}
            </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-70 ${focusRingClasses}`}
            >
              {loading ? `${t('auth.register.submit')}…` : t('auth.register.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
