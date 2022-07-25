import { combineReducers, configureStore, Store } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';
import { appGraphReducer } from '@suite-native/graph';

const rootReducer = combineReducers({
    appSettings: appSettingsReducer,
    appGraph: appGraphReducer,
});

export const store: Store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
