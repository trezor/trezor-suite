import { isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, isTrezorDeviceWithState } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { selectDeviceThunk } from '@suite-common/wallet-core';

import { selectHasDeviceSuiteSyncError, selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, getState, extra }) => {
        if (
            selectIsSuiteSyncEnabled(getState()) &&
            deviceActions.setDiscovered.match(action) &&
            action.payload.success
        ) {
            const suiteSyncErrors = selectHasDeviceSuiteSyncError(
                getState(),
                action.payload.staticSessionId,
            );
            if (!suiteSyncErrors) {
                extra.services.suiteSync.ensureWalletSuiteSyncOnUncontrolled({
                    deviceStaticSessionId: action.payload.staticSessionId,
                    isWriteMode: false,
                });
            }
        }

        if (selectIsSuiteSyncEnabled(getState()) && isAnyOf(selectDeviceThunk.fulfilled)(action)) {
            const { payload } = action as ReturnType<typeof selectDeviceThunk.fulfilled>;

            if (isTrezorDeviceWithState(payload.device) && payload.device.discovered) {
                const suiteSyncErrors = selectHasDeviceSuiteSyncError(
                    getState(),
                    payload.device?.state.staticSessionId,
                );

                // If the device is reselected with already existing error within the session, don't trigger it again.
                if (!suiteSyncErrors) {
                    extra.services.suiteSync.ensureWalletSuiteSyncOnUncontrolled({
                        deviceStaticSessionId: payload.device.state.staticSessionId,
                        isWriteMode: false,
                    });
                }
            }
        }

        return next(action);
    },
);
