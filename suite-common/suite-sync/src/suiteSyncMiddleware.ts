import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { applyDeviceStatesThunk, selectDeviceThunk } from '@suite-common/wallet-core';

import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

// Thunk triggers for which we want to turn on Suite Sync for the currently selected wallet
const suiteSyncTurnOnTriggers = [
    // New wallet created
    applyDeviceStatesThunk.fulfilled,
    // Wallet selected
    selectDeviceThunk.fulfilled,
] as const;

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, getState, extra }) => {
        if (selectIsSuiteSyncEnabled(getState()) && isAnyOf(...suiteSyncTurnOnTriggers)(action)) {
            const { payload } = action as ReturnType<(typeof suiteSyncTurnOnTriggers)[number]>;
            extra.services.suiteSync.turnOnSuiteSyncForWallet({
                staticSessionId: payload.device.state?.staticSessionId,
            });
        }

        return next(action);
    },
);
