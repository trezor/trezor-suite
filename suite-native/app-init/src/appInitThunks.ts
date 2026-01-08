import { connectInitThunk } from '@suite-common/connect-init';
import { initMessageSystemThunk, prepareCachedEnvData } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    createImportedDeviceThunk,
    initBlockchainThunk,
    initDevices,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import { initAnalyticsThunk } from '@suite-native/analytics';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { setIsAppReady } from '@suite-native/state';

const ACTION_PREFIX = '@suite-native/app';

export const postOnboardingInit = createThunk(
    `${ACTION_PREFIX}/postOnboardingInit`,
    async (_, { dispatch, getState }) => {
        try {
            await dispatch(connectInitThunk()).unwrap();
        } catch (error) {
            console.error(`Connect init error: ${JSON.stringify(error)}`);
        }

        try {
            // Needs to be finished before any TrezorConnect.blockchain* calls.
            await dispatch(initBlockchainThunk()).unwrap();
        } catch (error) {
            console.error(`Blockchain init error: ${JSON.stringify(error)}`);
        }

        dispatch(periodicCheckTokenDefinitionsThunk());
        dispatch(initStakeDataThunk());

        dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency: selectBaseCurrency(getState()),
            }),
        );

        // Create Portfolio Tracker device if it doesn't exist
        dispatch(createImportedDeviceThunk());

        dispatch(walletConnectInitThunk());
    },
);

export const applicationInit = createThunk(
    `${ACTION_PREFIX}/applicationInit`,
    async (_, { dispatch, getState }) => {
        await prepareCachedEnvData();
        dispatch(initAnalyticsThunk());
        dispatch(initMessageSystemThunk());

        // Select latest remembered device or Portfolio Tracker device.
        dispatch(initDevices());

        if (selectIsOnboardingFinished(getState())) {
            await dispatch(postOnboardingInit());
        }

        // Tell the application to render
        dispatch(setIsAppReady(true));
    },
);
