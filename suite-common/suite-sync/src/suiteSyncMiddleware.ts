import { UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    applyDeviceStatesThunk,
    deviceActions,
    handleDeviceDisconnect,
    selectDeviceByStaticSessionId,
    selectDeviceThunk,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

const getHasWalletBeenCreated = (action: UnknownAction) =>
    applyDeviceStatesThunk.fulfilled.match(action) &&
    action.payload &&
    typeof action.payload === 'object' &&
    'staticSessionId' in action.payload;

export const prepareSuiteSyncMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, getState, extra, dispatch }) => {
        if (getHasWalletBeenCreated(action) && selectIsSuiteSyncEnabled(getState())) {
            const { payload } = action as ReturnType<typeof applyDeviceStatesThunk.fulfilled>;
            const { staticSessionId } = payload;

            const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOnSuiteSyncForWallet({
                    device,
                });
            }
        }

        if (selectDeviceThunk.fulfilled.match(action) && selectIsSuiteSyncEnabled(getState())) {
            const { device } = action.payload;
            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOnSuiteSyncForWallet({ device });
            }
        }

        if (suiteSyncActions.updateSuiteSyncEnabled.match(action)) {
            const device = selectSelectedDevice(getState());
            const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(getState());
            if (isTrezorDeviceWithState(device) && !isPortfolioTrackerDevice) {
                extra.services.suiteSync.turnOnSuiteSyncForWallet({ device });
            }
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
