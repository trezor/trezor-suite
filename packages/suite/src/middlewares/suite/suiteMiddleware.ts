import { MiddlewareAPI } from 'redux';
import TrezorConnect, { DEVICE } from 'trezor-connect';
import { BLOCKCHAIN, SUITE, STORAGE } from '@suite-actions/constants';
import { init as initBlockchain } from '@suite-actions/blockchainActions';
import { init as initRouter, initialRedirection } from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { loadStorage } from '@suite-actions/storageActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import { AppState, Action, Dispatch } from '@suite-types';

const suite = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    // pass action to reducers
    next(action);

    switch (action.type) {
        case SUITE.INIT:
            // load storage
            api.dispatch(loadStorage());
            break;
        case STORAGE.LOADED:
            // redirect to onboarding or leave url as is
            await api.dispatch(initialRedirection());
            api.dispatch(suiteActions.initialRunCompleted()); // TODO: move it to onboarding, cancel this flag after user selection
            // initialize trezor-connect
            api.dispatch(trezorConnectActions.init());
            break;
        case SUITE.CONNECT_INITIALIZED:
            // trezor-connect init successfully
            api.dispatch(initBlockchain());
            if (process.env.SUITE_TYPE === 'web') TrezorConnect.renderWebUSBButton();
            break;
        case BLOCKCHAIN.READY:
            // dispatch initial location change
            api.dispatch(initRouter());
            // backend connected, suite is ready to use
            api.dispatch(suiteActions.onSuiteReady());
            break;

        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            api.dispatch(suiteActions.handleDeviceConnect(action.payload));
            break;
        case DEVICE.DISCONNECT:
            api.dispatch(suiteActions.handleDeviceDisconnect(action.payload));
            break;
        default:
            break;
    }

    // keep suite reducer synchronized with other reducers (selected device)
    if (api.dispatch(suiteActions.observeSelectedDevice(action))) {
        // device changed
    }

    return action;
};

export default suite;
