/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // The official @tailwindcss/typography plugin is not yet compatible with
    // Tailwind CSS v4, so it has been removed. The `prose` classes will not
    // be styled until a compatible version is released.
  ],
}