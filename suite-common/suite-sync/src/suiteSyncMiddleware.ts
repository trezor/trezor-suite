import { UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    applyDeviceStatesThunk,
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
    (action, { next, getState, extra }) => {
        // Wallet creation getting evolu keys
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

        // Selecting device (either by user or auto-selection on connect)
        if (selectDeviceThunk.fulfilled.match(action) && selectIsSuiteSyncEnabled(getState())) {
            const { device } = action.payload;
            if (isTrezorDeviceWithState(device)) {
                extra.services.suiteSync.turnOnSuiteSyncForWallet({ device });
            }
        }

        // Check currently selected device and subscribe if SuiteSync got enabled
        if (suiteSyncActions.updateSuiteSyncEnabled.match(action)) {
            const device = selectSelectedDevice(getState());
            const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(getState());
            if (isTrezorDeviceWithState(device) && !isPortfolioTrackerDevice) {
                extra.services.suiteSync.turnOnSuiteSyncForWallet({ device });
            }
        }

        return next(action);
    },
);
