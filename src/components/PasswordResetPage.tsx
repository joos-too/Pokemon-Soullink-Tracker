import React, {useEffect, useState, useRef, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {verifyPasswordResetCode, confirmPasswordReset, signOut} from 'firebase/auth';
import {auth} from '@/src/firebaseConfig';

interface PasswordResetPageProps {
    oobCode: string | null;
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({oobCode}) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const submittingRef = useRef(false);

    useEffect(() => {
        let active = true;
        const verify = async () => {
            if (!oobCode) {
                setError('Der Reset-Link ist ungültig oder abgelaufen.');
                setLoading(false);
                return;
            }
            try {
                const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
                if (!active) return;
                setEmail(emailFromCode);
            } catch (err) {
                console.error('verifyPasswordResetCode failed', err);
                if (!active) return;
                setError('Der Reset-Link ist ungültig oder abgelaufen.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };
        verify();
        return () => {
            active = false;
        };
    }, [oobCode]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (submittingRef.current || success) return;
        if (!oobCode) {
            setError('Es fehlt ein gültiger Reset-Code.');
            return;
        }
        if (password.length < 8) {
            setError('Das neue Passwort muss mindestens 8 Zeichen besitzen.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }
        setError(null);
        submittingRef.current = true;
        setSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            setError(null);
        } catch (err) {
            console.error('confirmPasswordReset failed', err);
            setError('Das Ändern des Passworts ist fehlgeschlagen. Versuche es erneut oder fordere einen neuen Link an.');
        } finally {
            setSubmitting(false);
            submittingRef.current = false;
        }
    };

    const handleBackToLogin = useCallback(async () => {
        try {
            await signOut(auth);
        } catch {
            // ignore sign out errors (e.g., already signed out)
        } finally {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        if (!success) return;
        let cancelled = false;
        const timeout = window.setTimeout(async () => {
            if (cancelled) return;
            await handleBackToLogin();
        }, 4000);
        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [success, handleBackToLogin]);

    const actionDisabled = submitting || loading || success;

    return (
        <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 text-gray-800 flex items-center justify-center">
            <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-gray-800 shadow-lg p-6 sm:p-8 rounded-lg">
                    <header className="text-center pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                        <img
                            src="/Soullinktracker-Logo - cropped.png"
                            alt="Soullink Tracker Logo"
                            className="mx-auto mb-3 w-40 h-40 object-contain"
                        />
                        <h1 className="text-2xl sm:text-3xl font-bold font-press-start tracking-tighter dark:text-gray-100">
                            Passwort zurücksetzen
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Wähle ein neues Passwort für deinen Soullink Tracker Account.
                        </p>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500 dark:text-gray-400">
                            <div className="h-10 w-10 border-4 border-gray-200 dark:border-gray-600 border-t-green-600 rounded-full animate-spin"/>
                            <p className="text-sm font-medium">Reset-Link wird geprüft…</p>
                        </div>
                    ) : success ? (
                        <div className="py-8 text-center space-y-4">
                            <p className="text-lg font-semibold text-green-600">Passwort aktualisiert!</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Du wirst gleich weitergeleitet.</p>
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="inline-flex justify-center w-full bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                            >
                                Zurück zur Anmeldung
                            </button>
                        </div>
                    ) : error && !email ? (
                        <div className="py-8 text-center space-y-4 text-red-600 dark:text-red-400">
                            <p className="text-lg font-semibold">Link ungültig</p>
                            <p className="text-sm">Bitte fordere über die Einstellungen eine neue Reset-Mail an.</p>
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="inline-flex justify-center w-full bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                Zurück
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">Account</p>
                                <p>{email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Neues Passwort</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Mindestens 8 Zeichen"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={actionDisabled}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort bestätigen</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Nochmals eingeben"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={actionDisabled}
                                />
                            </div>
                            {error && (
                                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                            )}
                            <button
                                type="submit"
                                disabled={actionDisabled}
                                className="w-full bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-70"
                            >
                                {submitting ? 'Speichern…' : 'Passwort setzen'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordResetPage;
