import { initMessageSystemThunk } from '@suite-common/message-system';
import * as trezorConnectActions from '@suite-common/connect-init';
import {
    initBlockchainThunk,
    initDevices,
    periodicFetchFiatRatesThunk,
} from '@suite-common/wallet-core';

import * as routerActions from 'src/actions/suite/routerActions';
import * as analyticsActions from 'src/actions/suite/analyticsActions';
import * as metadataActions from 'src/actions/suite/metadataActions';
import * as languageActions from 'src/actions/settings/languageActions';
import type { Dispatch, GetState } from 'src/types/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

import { SUITE } from './constants';
import { onSuiteReady } from './suiteActions';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const {
        suite: {
            settings: { language },
            lifecycle: { status },
        },
    } = getState();

    if (status !== 'initial') return;

    dispatch({ type: SUITE.INIT });

    dispatch(initDevices());

    // right after storage is loaded, we might start:

    // 1. init analytics
    dispatch(analyticsActions.init());

    // 2. fetching locales
    dispatch(languageActions.setLanguage(language));

    // 3. fetch message system config
    dispatch(initMessageSystemThunk({ jwsPublicKey: process.env.JWS_PUBLIC_KEY }));

    // 4. redirecting user into welcome screen (if needed)
    dispatch(routerActions.initialRedirection());

    // 5. init connect (could throw an error,
    // then the error is caught in <ErrorBoundary /> in Main.tsx
    try {
        // it is necessary to unwrap the result here because init calls async thunk from redux-toolkit which is always resolved
        // see more details here: https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
        await dispatch(trezorConnectActions.connectInitThunk()).unwrap();
    } catch (err) {
        dispatch({ type: SUITE.ERROR, error: err.message });
        throw err;
    }

    // 6. init backends
    await dispatch(initBlockchainThunk())
        .unwrap()
        .catch(err => console.error(err));

    // 7. init periodic fetching of fiat rates
    await dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'current',
            localCurrency: selectLocalCurrency(getState()),
        }),
    );
    await dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'lastWeek',
            localCurrency: selectLocalCurrency(getState()),
        }),
    );

    // 8. dispatch initial location change
    dispatch(routerActions.init());

    // 9. fetch metadata. metadata is not saved together with other data in storage.
    // historically it was saved in indexedDB together with devices and accounts and we did not need to load them
    // immediately after suite start.
    dispatch(metadataActions.fetchAndSaveMetadataForAllDevices());

    // 9. backend connected, suite is ready to use
    dispatch(onSuiteReady());
};
