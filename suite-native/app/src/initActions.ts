import { createThunk } from '@suite-common/redux-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import {
    createImportedDeviceThunk,
    initBlockchainThunk,
    initDevices,
    periodicFetchFiatRatesThunk,
} from '@suite-common/wallet-core';
import { initAnalyticsThunk } from '@suite-native/analytics';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { initMessageSystemThunk } from '@suite-common/message-system';
import { setIsAppReady, setIsConnectInitialized } from '@suite-native/state/src/appSlice';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import { TransactionCacheEngine } from '@suite-common/transaction-cache-engine';

let isAlreadyInitialized = false;

export const applicationInit = createThunk(
    `@app/init-actions`,
    async (_, { dispatch, getState }) => {
        if (isAlreadyInitialized) {
            return;
        }

        try {
            dispatch(initAnalyticsThunk());

            dispatch(initMessageSystemThunk());

            // Select latest remembered device or Portfolio Tracker device.
            dispatch(initDevices());

            await dispatch(connectInitThunk());

            TransactionCacheEngine.init();

            dispatch(setIsConnectInitialized(true));

            dispatch(initBlockchainThunk());

            dispatch(periodicCheckTokenDefinitionsThunk());

            dispatch(
                periodicFetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectFiatCurrencyCode(getState()),
                }),
            );

            // Create Portfolio Tracker device if it doesn't exist
            dispatch(createImportedDeviceThunk());
        } catch (error) {
            console.error(error);
        } finally {
            // Tell the application to render
            dispatch(setIsAppReady(true));
            isAlreadyInitialized = true;
        }
    },
);
