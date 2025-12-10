import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    applyDeviceStatesThunk,
    deviceActions,
    handleDeviceDisconnect,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

// Thunk triggers for which we want to turn on Suite Sync for the currently selected wallet
const suiteSyncTurnOnTriggers = [
    // New wallet created
    applyDeviceStatesThunk.fulfilled,
    // Wallet selected
    selectDeviceThunk.fulfilled,
] as const;

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, getState, extra, dispatch }) => {
        if (selectIsSuiteSyncEnabled(getState()) && isAnyOf(...suiteSyncTurnOnTriggers)(action)) {
            const { payload } = action as ReturnType<(typeof suiteSyncTurnOnTriggers)[number]>;
            extra.services.suiteSync.turnOnSuiteSyncForWallet({
                staticSessionId: payload.device.state?.staticSessionId,
            });
        }

        if (deviceActions.forgetDevice.match(action)) {
            const { device } = action.payload;

            dispatch(handleDeviceDisconnect(device));
            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOffSuiteSyncForWallet({
                    owner: device.suiteSyncOwner,
                });
            }
        }

        return next(action);
    },
);
