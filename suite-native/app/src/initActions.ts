import { Alert } from 'react-native';

import { createThunk } from '@suite-common/redux-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { initBlockchainThunk, reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { enabledNetworks } from '@suite-native/config';
import { initAnalytics } from '@suite-native/analytics';

import { setIsAppReady, setIsConnectInitialized } from '../../state/src/appSlice';

export const applicationInit = createThunk(`@app/init-actions`, async (_, { dispatch }) => {
    try {
        dispatch(initAnalytics());

        await dispatch(connectInitThunk()).unwrap();

        dispatch(setIsConnectInitialized(true));

        await dispatch(initBlockchainThunk()).unwrap();
        /* Invoke reconnect manually here because we need to have fiat rates initialized
         * immediately after the app is loaded.
         */

        /* TODO We should only reconnect for accounts that we currently need.
           Currently all supported networks get reconnected but this can raise some
           performance problems because of making calls to blockbook that are unnecessary.
        */
        const promises = enabledNetworks.map(network =>
            dispatch(reconnectBlockchainThunk(network)),
        );
        await Promise.all(promises);
    } catch (error) {
        Alert.alert('Error', error?.message ?? 'Unknown error');
        console.error(error.message);
    } finally {
        // Tell the application to render
        dispatch(setIsAppReady(true));
    }
});
