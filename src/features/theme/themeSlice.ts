import { PaletteMode } from '@mui/material';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  mode: PaletteMode;
}

// Get the initial theme from localStorage or default to 'light'
const getInitialTheme = (): PaletteMode => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    // Check if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'light';
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.mode);
      }
    },
    setTheme: (state, action: PayloadAction<PaletteMode>) => {
      state.mode = action.payload;

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
