/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Papan Komik palette — flat block colour, no gradients.
        ink: '#111111',
        paper: '#FDF6E3',
        'paper-2': '#F6EBD2',
        pulse: '#FF4D2E', // primary action / heat
        volt: '#2F6BFF', // link + info
        sun: '#FFD23F', // highlight / selection
        mint: '#12B886', // success / correct
        blood: '#E03131', // error / wrong
        ash: '#6B6257', // muted text on paper
        cloud: '#FFFFFF',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"Archivo"', 'ui-monospace', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
      },
      boxShadow: {
        // Hard offset shadows — no blur, ever.
        pop: '4px 4px 0 0 #111111',
        'pop-lg': '7px 7px 0 0 #111111',
        'pop-sm': '2px 2px 0 0 #111111',
        'pop-pulse': '4px 4px 0 0 #FF4D2E',
        'pop-volt': '4px 4px 0 0 #2F6BFF',
        'pop-sun': '4px 4px 0 0 #FFD23F',
        'pop-mint': '4px 4px 0 0 #12B886',
        'pop-none': '0 0 0 0 #111111',
      },
      backgroundImage: {
        // Hazard stripe used for structure/danger bands.
        hazard:
          'repeating-linear-gradient(45deg, #111111 0 12px, #FFD23F 12px 24px)',
        'hazard-ink':
          'repeating-linear-gradient(45deg, #111111 0 12px, #FDF6E3 12px 24px)',
        'hazard-blood':
          'repeating-linear-gradient(45deg, #E03131 0 12px, #FDF6E3 12px 24px)',
        dots: 'radial-gradient(#111111 1.5px, transparent 1.6px)',
      },
      backgroundSize: {
        dots: '12px 12px',
      },
      keyframes: {
        'panel-in': {
          '0%': { transform: 'translate(-6px, 6px)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' },
        },
        'stamp-in': {
          '0%': { transform: 'scale(1.6) rotate(-14deg)', opacity: '0' },
          '60%': { transform: 'scale(0.94) rotate(-8deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-9deg)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateX(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'row-in': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'panel-in': 'panel-in 240ms cubic-bezier(.2,.9,.2,1) both',
        'stamp-in': 'stamp-in 420ms cubic-bezier(.2,1.4,.4,1) both',
        flip: 'flip 260ms cubic-bezier(.2,.9,.2,1) both',
        blink: 'blink 1.05s steps(1) infinite',
        'row-in': 'row-in 220ms ease-out both',
      },
    },
  },
  plugins: [],
};
