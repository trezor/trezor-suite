import { configureStore, AsyncThunkAction } from '@reduxjs/toolkit';

import { appSettingsReducer } from '@suite-native/module-settings';

declare module 'redux' {
    export interface Dispatch {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;
    }
}

export const store = configureStore({
    reducer: {
        appSettings: appSettingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
