import { SUITE } from './constants';

import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import * as analyticsActions from '@suite-actions/analyticsActions';
import * as messageSystemActions from '@suite-actions/messageSystemActions';
import * as languageActions from '@settings-actions/languageActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';

import type { Dispatch, GetState } from '@suite-types';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    const {
        suite: {
            settings: { language },
            lifecycle: { status },
        },
        analytics,
    } = getState();

    if (status !== 'initial') return;

    dispatch({ type: SUITE.INIT });

    dispatch(suiteActions.initDevices());

    // right after storage is loaded, we might start:

    // 1. init analytics
    dispatch(analyticsActions.init(analytics));

    // 2. fetching locales
    dispatch(languageActions.setLanguage(language));

    // 3. fetch message system config
    await dispatch(messageSystemActions.init()).catch(err => console.error(err));

    // 4. redirecting user into welcome screen (if needed)
    dispatch(routerActions.initialRedirection());

    // 5. init connect (could throw an error,
    // then the error is caught in <ErrorBoundary /> in Main.tsx
    try {
        // it is necessary to unwrap the result here because init calls async thunk from redux-toolkit which is always resolved
        // see more details here: https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
        await dispatch(trezorConnectActions.init()).unwrap();
    } catch (err) {
        dispatch({ type: SUITE.ERROR, error: err.message });
        throw err;
    }

    // 6. init backends
    await dispatch(blockchainActions.init()).catch(err => console.error(err));

    // 7. dispatch initial location change
    dispatch(routerActions.init());

    // 8. backend connected, suite is ready to use
    dispatch({ type: SUITE.READY });
};
