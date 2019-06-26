import { MiddlewareAPI } from 'redux';
import { DEVICE } from 'trezor-connect';
import { BLOCKCHAIN, SUITE, STORAGE } from '@suite-actions/constants';
import { init as initBlockchain } from '@suite-actions/blockchainActions';
import { init as initRouter } from '@suite-actions/routerActions';
import * as SuiteActions from '@suite-actions/suiteActions';
import { load as loadStorage } from '@suite-actions/storageActions';
import { init as initTrezorConnect } from '@suite-actions/trezorConnectActions';
import { AppState, Action, Dispatch } from '@suite-types/index';

const suite = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action to reducers
    next(action);

    switch (action.type) {
        case SUITE.INIT:
            // load storage
            api.dispatch(loadStorage());
            break;
        case STORAGE.LOADED:
            // initialize backends
            api.dispatch(initTrezorConnect());
            break;
        case SUITE.CONNECT_INITIALIZED:
            // trezor-connect init successfully
            api.dispatch(initBlockchain());
            break;
        case BLOCKCHAIN.READY:
            // dispatch initial location change
            api.dispatch(initRouter());
            // backend connected, suite is ready to use
            api.dispatch({ type: SUITE.READY });
            break;

        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            api.dispatch(SuiteActions.handleDeviceConnect(action.payload));
            break;
        case DEVICE.DISCONNECT:
            api.dispatch(SuiteActions.handleDeviceDisconnect(action.payload));
            break;
        case DEVICE.CHANGED:
            api.dispatch(SuiteActions.handleDeviceChanged(action.payload));
            break;
        default:
            break;
    }
    // keep suite reducer synchronized with other reducers (selected device)
    // api.dispatch(SuiteActions.handleDeviceChanged(action.payload));

    if (api.dispatch(SuiteActions.observeSelectedDevice(action))) {
        // device changed
    }

    return action;
};

export default suite;
