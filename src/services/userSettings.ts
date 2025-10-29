const RIVAL_PREFERENCES_KEY = 'soullink:rivalPreferences';

export type RivalGender = 'male' | 'female';
export type RivalPreferences = Record<string, RivalGender>;

/**
 * Ruft die gespeicherten Rivalen-Präferenzen des Benutzers aus dem Local Storage ab.
 */
export const getRivalPreferences = (): RivalPreferences => {
    try {
        const stored = localStorage.getItem(RIVAL_PREFERENCES_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
            }
        }
    } catch (e) {
        // Ignoriere Fehler, gib leeres Objekt zurück
    }
    return {};
};

/**
 * Speichert eine spezifische Rivalen-Präferenz für den Benutzer im Local Storage.
 * @param rivalKey Der eindeutige Schlüssel des Rivalen (z.B. 'brix_maike').
 * @param gender Die ausgewählte Variante ('male' oder 'female').
 */
export const setRivalPreference = (rivalKey: string, gender: RivalGender): void => {
    try {
        const currentPrefs = getRivalPreferences();
        const newPrefs = { ...currentPrefs, [rivalKey]: gender };
        localStorage.setItem(RIVAL_PREFERENCES_KEY, JSON.stringify(newPrefs));
    } catch (e) {
        // Ignoriere Speicherfehler
    }
};