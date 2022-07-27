import { configureStore, Store } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/home-graph';

export const store: Store = configureStore({
    reducer: {
        appSettings: appSettingsReducer,
        appGraph: appGraphReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
