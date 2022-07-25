import { configureStore } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/graph';

export const store = configureStore({
    reducer: {
        appSettings: appSettingsReducer,
        appGraph: appGraphReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
