import { MiddlewareAPI } from 'redux';
import TrezorConnect, { DEVICE } from 'trezor-connect';
import { BLOCKCHAIN, SUITE, STORAGE, ROUTER } from '@suite-actions/constants';
import { init as initBlockchain } from '@suite-actions/blockchainActions';
import { init as initRouter, initialRedirection } from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { resolveRememberRequest } from '@suite-actions/modalActions';
import { loadStorage } from '@suite-actions/storageActions';
import { fetchLocale } from '@suite-actions/languageActions.useNative';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import { getApp } from '@suite-utils/router';

import { AppState, Action, Dispatch } from '@suite-types';

const suite = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const prevApp = api.getState().router.app;
    if (action.type === ROUTER.LOCATION_CHANGE && getApp(action.url) !== prevApp) {
        api.dispatch({ type: SUITE.APP_CHANGE, payload: getApp(action.url) });
    }

    // pass action to reducers
    next(action);

    switch (action.type) {
        case SUITE.INIT:
            // load storage
            api.dispatch(loadStorage());
            break;
        case STORAGE.LOADED:
            // set language
            await api.dispatch(fetchLocale(action.payload.suite.language));
            // redirect to onboarding or leave url as is
            await api.dispatch(initialRedirection());
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
            api.dispatch(resolveRememberRequest(action.payload));
            api.dispatch(suiteActions.handleDeviceConnect(action.payload));
            break;
        case DEVICE.DISCONNECT:
            api.dispatch(resolveRememberRequest(action.payload));
            api.dispatch(suiteActions.handleDeviceDisconnect(action.payload));
            break;
        case SUITE.FORGET_DEVICE:
            api.dispatch(suiteActions.handleDeviceDisconnect(action.payload));
            break;
        case SUITE.CREATE_DEVICE_INSTANCE:
            api.dispatch(suiteActions.selectDevice(action.payload));
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
