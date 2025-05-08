import { connectInitThunk } from '@suite-common/connect-init';
import { initMessageSystemThunk } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    createImportedDeviceThunk,
    initBlockchainThunk,
    initDevices,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import { initAnalyticsThunk } from '@suite-native/analytics';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { setIsAppReady, setIsConnectInitialized } from '@suite-native/state/src/appSlice';

let isAlreadyInitialized = false;

export const applicationInit = createThunk(
    `@app/init-actions`,
    async (_, { dispatch, getState }) => {
        if (isAlreadyInitialized) {
            return;
        }

        dispatch(initAnalyticsThunk());

        dispatch(initMessageSystemThunk());

        // Select latest remembered device or Portfolio Tracker device.
        dispatch(initDevices());

        try {
            await dispatch(connectInitThunk()).unwrap();
        } catch (error) {
            console.error(`Connect init error: ${JSON.stringify(error)}`);
        }

        dispatch(setIsConnectInitialized(true));

        dispatch(initBlockchainThunk());

        dispatch(periodicCheckTokenDefinitionsThunk());

        dispatch(initStakeDataThunk());

        dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency: selectLocalCurrency(getState()),
            }),
        );

        // Create Portfolio Tracker device if it doesn't exist
        dispatch(createImportedDeviceThunk());

        if (selectIsFeatureFlagEnabled(getState(), FeatureFlag.IsWalletConnectEnabled)) {
            dispatch(walletConnectInitThunk());
        }

        // Tell the application to render
        dispatch(setIsAppReady(true));
        isAlreadyInitialized = true;
    },
);
