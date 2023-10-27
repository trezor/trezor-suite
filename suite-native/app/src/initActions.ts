import { createThunk } from '@suite-common/redux-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { createImportedDeviceThunk, initBlockchainThunk } from '@suite-common/wallet-core';
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

            // TODO: uncomment or revert commit when UI is ready for message system
            // dispatch(initMessageSystemThunk({ jwsPublicKey: getJWSPublicKey() }));

            await dispatch(connectInitThunk());

            dispatch(setIsConnectInitialized(true));

            dispatch(initBlockchainThunk());

            dispatch(
                periodicFetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectFiatCurrencyCode(getState()),
                }),
            );

            // We need to make sure to have imported device in state
            // Since devices are not persisted,
            // we need to create device instance on app start
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
