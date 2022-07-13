import { configureStore } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';

export const store = configureStore({
    reducer: {
        appSettings: appSettingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
