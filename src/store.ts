import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { themeReducer } from './features/theme/themeSlice';
import { api } from './services/api/apiService';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
  devTools: true,
});

// Enable refetchOnFocus/refetchOnReconnect features
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
