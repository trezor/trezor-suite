import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ServiceWorkerUpdate } from './control/serviceWorkerControl';

export type ServiceWorkerUpdateState = {
    /** A newer worker that waits to take over, `null` while there is none. */
    waitingUpdate: ServiceWorkerUpdate | null;
};

export type ServiceWorkerUpdateRootState = {
    serviceWorkerUpdate: ServiceWorkerUpdateState;
};

export const serviceWorkerUpdateInitialState: ServiceWorkerUpdateState = {
    waitingUpdate: null,
};

const serviceWorkerUpdateSlice = createSlice({
    name: 'serviceWorkerUpdate',
    initialState: serviceWorkerUpdateInitialState,
    reducers: {
        setWaitingUpdate(
            state: ServiceWorkerUpdateState,
            action: PayloadAction<ServiceWorkerUpdate | null>,
        ) {
            state.waitingUpdate = action.payload;
        },
    },
});

export const serviceWorkerUpdateActions = serviceWorkerUpdateSlice.actions;
export const serviceWorkerUpdateReducer = serviceWorkerUpdateSlice.reducer;

export const selectServiceWorkerWaitingUpdate = (state: ServiceWorkerUpdateRootState) =>
    state.serviceWorkerUpdate.waitingUpdate;
