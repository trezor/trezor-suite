import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions, selectDeviceThunk } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

// Thunk triggers for which we want to turn on Suite Sync for the currently selected wallet
const suiteSyncTurnOnTriggers = [
    // Wallet selected
    selectDeviceThunk.fulfilled,
] as const;

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, getState, extra }) => {
        if (selectIsSuiteSyncEnabled(getState()) && deviceActions.setDiscovered.match(action)) {
            if (action.payload.success) {
                extra.services.suiteSync.ensureWalletSuiteSyncOn({
                    deviceStaticSessionId: action.payload.staticSessionId,
                    isWriteMode: false,
                });
            }
        }

        if (selectIsSuiteSyncEnabled(getState()) && isAnyOf(...suiteSyncTurnOnTriggers)(action)) {
            const { payload } = action as ReturnType<(typeof suiteSyncTurnOnTriggers)[number]>;

            if (isTrezorDeviceWithState(payload.device)) {
                extra.services.suiteSync.ensureWalletSuiteSyncOn({
                    deviceStaticSessionId: payload.device.state.staticSessionId,
                    isWriteMode: false,
                });
            }
        }

        return next(action);
    },
);
