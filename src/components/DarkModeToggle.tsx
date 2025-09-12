import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkModeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = window.localStorage.getItem('color-theme');
            if (stored) return stored === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            window.localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            window.localStorage.setItem('color-theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
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