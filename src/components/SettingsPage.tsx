import React, {useState, useMemo} from 'react';
import {PLAYER1_COLOR, PLAYER2_COLOR} from '@/constants';
import type {TrackerMember, GameVersion, VariableRival, UserSettings, RivalGender} from '@/types';
import {FiShield, FiUserPlus} from 'react-icons/fi';

interface SettingsPageProps {
    trackerTitle: string;
    player1Name: string;
    player2Name: string;
    onTitleChange: (title: string) => void;
    onNameChange: (player: 'player1Name' | 'player2Name', name: string) => void;
    onBack: () => void;
    legendaryTrackerEnabled: boolean;
    onlegendaryTrackerToggle: (enabled: boolean) => void;
    rivalCensorEnabled: boolean;
    onRivalCensorToggle: (enabled: boolean) => void;
    members: TrackerMember[];
    onInviteMember: (email: string) => Promise<void>;
    canManageMembers: boolean;
    currentUserEmail?: string | null;
    gameVersion?: GameVersion;
    rivalPreferences?: UserSettings['rivalPreferences'];
    onRivalPreferenceChange: (key: string, gender: RivalGender) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
                                                       trackerTitle,
                                                       player1Name,
                                                       player2Name,
                                                       onTitleChange,
                                                       onNameChange,
                                                       onBack,
                                                       legendaryTrackerEnabled,
                                                       onlegendaryTrackerToggle,
                                                       rivalCensorEnabled,
                                                       onRivalCensorToggle,
                                                       members,
                                                       onInviteMember,
                                                       canManageMembers,
                                                       currentUserEmail,
                                                       gameVersion,
                                                       rivalPreferences,
                                                       onRivalPreferenceChange,
                                                   }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);

    const variableRivals = useMemo(() => {
        if (!gameVersion) return [];
        const seen = new Set<string>();
        const result: VariableRival[] = [];
        for (const cap of gameVersion.rivalCaps) {
            if (typeof cap.rival === 'object' && !seen.has(cap.rival.key)) {
                result.push(cap.rival);
                seen.add(cap.rival.key);
            }
        }
        return result;
    }, [gameVersion]);

    const handleInvite = async (event: React.FormEvent) => {
        event.preventDefault();
        setInviteError(null);
        setInviteMessage(null);
        setInviteLoading(true);
        try {
            await onInviteMember(inviteEmail);
            setInviteMessage('Mitglied erfolgreich hinzugefügt.');
            setInviteEmail('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
            setInviteError(message);
        } finally {
            setInviteLoading(false);
        }
    };

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === b.role) return a.email.localeCompare(b.email);
        return a.role === 'owner' ? -1 : 1;
    });

    const getRivalNameFromOption = (option: string): string => {
        return option.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-[#f0f0f0] dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg">
                <header className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs uppercase tracking-[0.3em] text-green-600">Tracker</p>
                    <h1 className="text-2xl font-bold font-press-start dark:text-gray-100 mt-2">Einstellungen</h1>
                </header>

                <main className="mt-6 space-y-8">
                    <section>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label htmlFor="trackerTitle"
                                       className="block text-sm font-bold mb-2 text-gray-800 dark:text-gray-200">
                                    Tracker Titel
                                </label>
                                <input
                                    id="trackerTitle"
                                    type="text"
                                    value={trackerTitle}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="z. B. Schwarz 2 Randomizer"
                                />
                            </div>
                            <div>
                                <label htmlFor="player1Name" className="block text-sm font-bold mb-2"
                                       style={{color: PLAYER1_COLOR}}>
                                    Name Spieler 1
                                </label>
                                <input
                                    id="player1Name"
                                    type="text"
                                    value={player1Name}
                                    onChange={(e) => onNameChange('player1Name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="player2Name" className="block text-sm font-bold mb-2"
                                       style={{color: PLAYER2_COLOR}}>
                                    Name Spieler 2
                                </label>
                                <input
                                    id="player2Name"
                                    type="text"
                                    value={player2Name}
                                    onChange={(e) => onNameChange('player2Name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 mb-4">Tracker
                            Optionen</h2>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">Legendary Tracker</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Tracke die Anzahl der
                                    Legendaries, den ihr in der Challenge begegnet.
                                </div>
                            </div>
                            <label htmlFor="legendary-toggle"
                                   className="inline-flex relative items-center cursor-pointer">
                                <input type="checkbox" checked={legendaryTrackerEnabled}
                                       onChange={(e) => onlegendaryTrackerToggle(e.target.checked)}
                                       id="legendary-toggle" className="sr-only peer"/>
                                <div
                                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">Rivalenkämpfe zensieren
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Verbirgt Details zu
                                    Rivalenkämpfen, bis sie aufgedeckt werden.
                                </div>
                            </div>
                            <label htmlFor="rival-censor-toggle"
                                   className="inline-flex relative items-center cursor-pointer">
                                <input type="checkbox" checked={rivalCensorEnabled}
                                       onChange={(e) => onRivalCensorToggle(e.target.checked)} id="rival-censor-toggle"
                                       className="sr-only peer"/>
                                <div
                                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </section>

                    {variableRivals.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 mb-4">
                                Rivalen-Auswahl
                            </h2>
                            {variableRivals.map(rival => (
                                <div key={rival.key} className="mb-4">
                                    <div className="flex items-center gap-4 text-gray-800 dark:text-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name={`rival-${rival.key}`} value="male"
                                                   checked={(rivalPreferences?.[rival.key] || 'male') === 'male'}
                                                   onChange={() => onRivalPreferenceChange(rival.key, 'male')}
                                                   className="h-4 w-4 accent-green-600"/> {getRivalNameFromOption(rival.options.male)}
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name={`rival-${rival.key}`} value="female"
                                                   checked={rivalPreferences?.[rival.key] === 'female'}
                                                   onChange={() => onRivalPreferenceChange(rival.key, 'female')}
                                                   className="h-4 w-4 accent-green-600"/> {getRivalNameFromOption(rival.options.female)}
                                        </label>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Wähle deinen Antagonisten
                                        für die korrekte Darstellung in den Rivalenkämpfe aus.
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Mitglieder</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {canManageMembers ? 'Nur vorhandene Accounts können hinzugefügt werden.' : 'Nur Owner können neue Mitglieder hinzufügen.'}
                                </p>
                            </div>
                            <span className="text-xs text-gray-500">{members.length} Nutzer</span>
                        </div>

                        <ul className="space-y-3 mb-4">
                            {sortedMembers.map((member) => (
                                <li key={member.uid}
                                    className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {member.email}
                                            {currentUserEmail && member.email === currentUserEmail &&
                                                <span className="ml-2 text-xs text-green-600">(Du)</span>}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {member.addedAt ? new Date(member.addedAt).toLocaleDateString() : 'Datum unbekannt'}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                            member.role === 'owner'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                        }`}>
                    {member.role === 'owner' && <FiShield/>}
                                        {member.role === 'owner' ? 'Owner' : 'Mitglied'}
                  </span>
                                </li>
                            ))}
                            {sortedMembers.length === 0 && (
                                <li className="text-sm text-gray-500 dark:text-gray-400">Keine Mitglieder gefunden.</li>
                            )}
                        </ul>

                        {canManageMembers && (
                            <form onSubmit={handleInvite}
                                  className="space-y-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
                                <div
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    <FiUserPlus/> Mitglied hinzufügen
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                        placeholder="trainer@example.com"
                                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                    >
                                        {inviteLoading ? 'Hinzufügen…' : 'Einladen'}
                                    </button>
                                </div>
                                {inviteError && <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>}
                                {inviteMessage &&
                                    <p className="text-sm text-green-600 dark:text-green-400">{inviteMessage}</p>}
                            </form>
                        )}
                    </section>
                </main>

                <footer className="mt-8 text-center">
                    <button
                        onClick={onBack}
                        className="bg-gray-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-gray-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    >
                        Zurück zum Tracker
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsPage;
