import { createThunk } from '@suite-common/redux-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { initBlockchainThunk } from '@suite-common/wallet-core';
import { initAnalyticsThunk } from '@suite-native/analytics';
import { periodicFetchFiatRatesThunk } from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode } from '@suite-native/module-settings';

import { setIsAppReady, setIsConnectInitialized } from '../../state/src/appSlice';

let isAlreadyInitialized = false;

export const applicationInit = createThunk(
    `@app/init-actions`,
    async (_, { dispatch, getState }) => {
        if (isAlreadyInitialized) {
            return;
        }

        try {
            dispatch(initAnalyticsThunk());

            await dispatch(connectInitThunk()).unwrap();

            dispatch(setIsConnectInitialized(true));

            dispatch(initBlockchainThunk()).unwrap();

            dispatch(
                periodicFetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectFiatCurrencyCode(getState()),
                }),
            );
        } catch (error) {
            console.error(error);
        } finally {
            // Tell the application to render
            dispatch(setIsAppReady(true));
            isAlreadyInitialized = true;
        }
    },
);
