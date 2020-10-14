import { MiddlewareAPI } from 'redux';
import TrezorConnect, { DEVICE } from 'trezor-connect';
import { SUITE, STORAGE, ROUTER } from '@suite-actions/constants';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { loadStorage } from '@suite-actions/storageActions';
import { fetchLocale } from '@settings-actions/languageActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import { getApp } from '@suite-utils/router';
import { AppState, Action, Dispatch } from '@suite-types';
import { isWeb } from '@suite-utils/env';

const suite = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const prevApp = api.getState().router.app;
    if (action.type === ROUTER.LOCATION_CHANGE && getApp(action.url) !== prevApp) {
        api.dispatch({ type: SUITE.APP_CHANGED, payload: getApp(action.url) });
    }

    // pass action to reducers
    next(action);

    switch (action.type) {
        case SUITE.INIT:
            // load storage
            api.dispatch(loadStorage());
            break;
        case STORAGE.LOADED: {
            // select first device from storage
            if (
                !api.getState().suite.device &&
                action.payload.devices &&
                action.payload.devices[0]
            ) {
                api.dispatch(suiteActions.selectDevice(action.payload.devices[0]));
            }
            // right after storage is loaded, we might start:
            // 1. fetching locales
            // 2. redirecting user into welcome screen (if needed)
            await Promise.all([
                api.dispatch(fetchLocale(action.payload.suite.settings.language)),
                api.dispatch(routerActions.initialRedirection()),
            ]);
            // 3. init connect;
            api.dispatch(trezorConnectActions.init());

            // 4. init analytics - calling init here means opt-out from analytics. If not called here
            // it would become opt-in. init analytics only if instanceId does not exist yet.
            if (!api.getState().analytics.instanceId) {
                api.dispatch(analyticsActions.init());
            }
            break;
        }
        case SUITE.CONNECT_INITIALIZED:
            // trezor-connect init successfully
            api.dispatch(blockchainActions.init());
            if (isWeb()) TrezorConnect.renderWebUSBButton();
            break;
        case BLOCKCHAIN.READY:
            // dispatch initial location change
            api.dispatch(routerActions.init());
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
        case SUITE.FORGET_DEVICE:
            api.dispatch(suiteActions.handleDeviceDisconnect(action.payload));
            break;
        case SUITE.CREATE_DEVICE_INSTANCE:
            api.dispatch(suiteActions.selectDevice(action.payload));
            break;
        case SUITE.REQUEST_AUTH_CONFIRM:
            api.dispatch(suiteActions.authConfirm());
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
