import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export function getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
}

export function getDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    try {
        const stored = window.localStorage?.getItem('color-theme');
        if (stored === 'dark') return true;
        if (stored === 'light') return false;
        return document.documentElement.classList.contains('dark') || getSystemPrefersDark();
    } catch {
        return document.documentElement.classList.contains('dark');
    }
}

export function setDarkMode(enabled: boolean) {
    try {
        if (enabled) {
            document.documentElement.classList.add('dark');
            window.localStorage?.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            window.localStorage?.setItem('color-theme', 'light');
        }
    } catch {}
}

const DarkModeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(getDarkMode());

    useEffect(() => {
        setDarkMode(isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        // Sync with external changes (e.g., other UI triggers)
        const target = document.documentElement;
        const observer = new MutationObserver(() => {
            setIsDarkMode(getDarkMode());
        });
        observer.observe(target, { attributes: true, attributeFilter: ['class'] });
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'color-theme') setIsDarkMode(getDarkMode());
        };
        window.addEventListener('storage', onStorage);
        return () => {
            observer.disconnect();
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
        >
            {isDarkMode ? <FiSun size={28} /> : <FiMoon size={28} />}
        </button>
    );
};

export default DarkModeToggle;
