/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // InterVariable gives you the variable-weight version from @fontsource-variable/inter
        sans: ['InterVariable', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};

