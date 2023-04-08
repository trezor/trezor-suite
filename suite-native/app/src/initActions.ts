import { Alert } from 'react-native';

import { createThunk } from '@suite-common/redux-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { initBlockchainThunk } from '@suite-common/wallet-core';
import { initAnalyticsThunk } from '@suite-native/analytics';
import { periodicFetchFiatRatesThunk } from '@suite-native/fiat-rates';

import { setIsAppReady, setIsConnectInitialized } from '../../state/src/appSlice';

let isAlreadyInitialized = false;

export const applicationInit = createThunk(`@app/init-actions`, async (_, { dispatch }) => {
    if (isAlreadyInitialized) {
        return;
    }

    try {
        dispatch(initAnalyticsThunk());

        await dispatch(connectInitThunk()).unwrap();

        dispatch(setIsConnectInitialized(true));

        dispatch(initBlockchainThunk()).unwrap();

        dispatch(periodicFetchFiatRatesThunk({ rateType: 'current' }));
    } catch (error) {
        Alert.alert('Error', error?.message ?? 'Unknown error');
        console.error(error.message);
    } finally {
        // Tell the application to render
        dispatch(setIsAppReady(true));
        isAlreadyInitialized = true;
    }
});
