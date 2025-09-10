// tailwind.config.js
const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'press-start': ['Press Start 2P', 'cursive'],
                'roboto': ['Roboto', 'sans-serif'],
            }
        },
    },
    plugins: [],
    darkMode: 'class', // This is the crucial part for dark mode
}