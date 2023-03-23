import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { initMessageSystemThunk } from '@suite-common/message-system';
import * as languageActions from '@settings-actions/languageActions';
import type { Dispatch, GetState } from '@suite-types';

import * as trezorConnectActions from '@suite-common/connect-init';
import { initBlockchainThunk } from '@suite-common/wallet-core';

import { SUITE } from './constants';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const {
        suite: {
            settings: { language },
            lifecycle: { status },
        },
    } = getState();

    if (status !== 'initial') return;

    dispatch({ type: SUITE.INIT });

    dispatch(suiteActions.initDevices());

    // right after storage is loaded, we might start:

    // 1. init analytics
    dispatch(analyticsActions.init());

    // 2. fetching locales
    dispatch(languageActions.setLanguage(language));

    // 3. fetch message system config
    dispatch(initMessageSystemThunk());

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

    // 7. dispatch initial location change
    dispatch(routerActions.init());

    // 8. backend connected, suite is ready to use
    dispatch({ type: SUITE.READY });
};
