import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, isTrezorDeviceWithState, selectDeviceThunk } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type WithServices, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';

import {
    type WithSuiteSyncAndDeviceState,
    selectHasDeviceSuiteSyncError,
    selectIsSuiteSyncEnabled,
} from './suiteSyncSelectors';

type SuiteSyncMiddlewareDeps = WithServices<SuiteSyncDep>;
type SuiteSyncMiddlewareState = WithSuiteSyncAndDeviceState & MessageSystemRootState;

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps<
    SuiteSyncMiddlewareDeps,
    UnknownAction,
    SuiteSyncMiddlewareState
>((action, { next, getState, extra }) => {
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
        const { payload } = action;

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
});
