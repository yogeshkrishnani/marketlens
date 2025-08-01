import { validateEnvironmentVariables } from '@utils/envValidation';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from '@/App';
import { store } from '@/store';

import '@services/firebase/config';

validateEnvironmentVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
