import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, isTrezorDeviceWithState, selectDeviceThunk } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncBlockedByError,
    selectIsSuiteSyncEnabled,
} from './suiteSyncSelectors';

export type SuiteSyncMiddlewareDeps = WithServices<SuiteSyncDep>;
export type SuiteSyncMiddlewareState = WithSuiteSyncAndDeviceState & MessageSystemRootState;

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
        if (!selectIsSuiteSyncBlockedByError(getState(), action.payload.staticSessionId)) {
            extra.services.suiteSync.ensureWalletSuiteSyncOnUncontrolled({
                deviceStaticSessionId: action.payload.staticSessionId,
                isWriteMode: false,
            });
        }
    }

    if (selectIsSuiteSyncEnabled(getState()) && isAnyOf(selectDeviceThunk.fulfilled)(action)) {
        const { payload } = action;

        if (isTrezorDeviceWithState(payload.device) && payload.device.discovered) {
            // A device reselected with an error from this session is not retried, unless it was only disconnected.
            if (
                !selectIsSuiteSyncBlockedByError(getState(), payload.device.state.staticSessionId)
            ) {
                extra.services.suiteSync.ensureWalletSuiteSyncOnUncontrolled({
                    deviceStaticSessionId: payload.device.state.staticSessionId,
                    isWriteMode: false,
                });
            }
        }
    }

    return next(action);
});
