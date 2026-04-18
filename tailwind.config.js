export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#F7F6F3',
        surface:  '#FFFFFF',
        s2:       '#F2F1EE',
        s3:       '#ECEAE6',
        border:   '#E2E0DA',
        accent:   '#1A3C2F',
        accent2:  '#2D6A4F',
        accentL:  '#D8F3DC',
        gold:     '#B8860B',
        goldL:    '#FFF8DC',
        apptext:  '#111111',
        text2:    '#555555',
        muted:    '#999999',
        danger:   '#C0392B',
        dangerL:  '#FDEDEC',
        success:  '#1E8449',
        successL: '#EAFAF1',
        warn:     '#D68910',
        warnL:    '#FEFDE7',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      maxWidth: { app: '480px' },
    },
  },
  plugins: [],
};
