import React, {useState} from 'react';
import {FiArrowLeft, FiMail, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiLogOut} from 'react-icons/fi';
import {focusRingClasses} from '@/src/styles/focusRing';
import {requestPasswordReset} from '@/src/services/auth';

interface UserSettingsPageProps {
    email?: string | null;
    onBack: () => void;
    onLogout: () => void;
}

const UserSettingsPage: React.FC<UserSettingsPageProps> = ({email, onBack, onLogout}) => {
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!email) {
            setStatus('error');
            setMessage('Für deinen Account ist keine Email hinterlegt.');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setMessage(null);
        try {
            await requestPasswordReset(email);
            setStatus('success');
            setMessage('Wir haben dir eine Email mit einem Link zum Zurücksetzen deines Passworts geschickt.');
        } catch (error) {
            const fallback = error instanceof Error ? error.message : 'Das Zurücksetzen ist fehlgeschlagen.';
            setStatus('error');
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
                    <FiArrowLeft/> Zurück
                </button>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-8 shadow-[6px_6px_0_0_rgba(31,41,55,0.25)]">
                    <header className="mb-6">
                        <p className="text-xs uppercase tracking-[0.3em] text-green-600">Account</p>
                        <h1 className="text-2xl font-bold font-press-start text-gray-900 dark:text-gray-100 mt-3">Einstellungen</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                            Hier findest du deine Anmeldedaten und kannst dein Passwort per Email zurücksetzen.
                        </p>
                    </header>

                    <section className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                            <FiMail className="mt-1" size={20}/>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Email</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{email || '—'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Wir senden den Reset-Link an diese Adresse.
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
                                {loading ? <FiRefreshCw className="animate-spin"/> : <FiRefreshCw/>}
                                Passwort zurücksetzen
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Du erhältst eine Email mit einem Bestätigungslink. Klicke ihn innerhalb von 60 Minuten, um ein neues Passwort zu vergeben.
                            </p>
                        </div>

                        {message && (
                            <div
                                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                                    status === 'success'
                                        ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200'
                                        : 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'
                                }`}
                                role="status"
                                aria-live="polite"
                            >
                                {status === 'success' ? <FiCheckCircle className="mt-0.5"/> : <FiAlertTriangle className="mt-0.5"/>}
                                <span>{message}</span>
                            </div>
                        )}
                    </section>

                    <section className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Du willst dich abmelden? Das beendet die Sitzung auf all deinen Geräten.
                        </p>
                        <button
                            type="button"
                            onClick={onLogout}
                            className={`inline-flex items-center gap-2 rounded-md border border-red-200 dark:border-red-700 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 ${focusRingClasses}`}
                        >
                            <FiLogOut/> Logout
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default UserSettingsPage;
