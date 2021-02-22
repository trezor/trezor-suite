import { MiddlewareAPI } from 'redux';
import TrezorConnect, { DEVICE } from 'trezor-connect';
import { SUITE, STORAGE, ROUTER } from '@suite-actions/constants';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as analyticsActions from '@suite-actions/analyticsActions';
import * as storageActions from '@suite-actions/storageActions';
import { fetchLocale } from '@settings-actions/languageActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import { getApp } from '@suite-utils/router';
import { AppState, Action, Dispatch } from '@suite-types';
import { isWeb } from '@suite-utils/env';
import { sortByTimestamp } from '@suite-utils/device';

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
            await api.dispatch(storageActions.init());
            api.dispatch(suiteActions.setInitialTheme());
            // load storage
            api.dispatch(storageActions.loadStorage());
            break;
        case STORAGE.LOADED: {
            // select first device from storage
            if (
                !api.getState().suite.device &&
                action.payload.devices &&
                action.payload.devices[0]
            ) {
                // if there are force remember devices, forget them and pick the first one of them as selected device
                const forcedDevices = action.payload.devices.filter(
                    d => d.forceRemember && d.remember,
                );
                forcedDevices.forEach(d => {
                    api.dispatch(suiteActions.rememberDevice(d));
                });
                api.dispatch(
                    suiteActions.selectDevice(
                        forcedDevices.length
                            ? forcedDevices[0]
                            : sortByTimestamp([...action.payload.devices])[0],
                    ),
                );
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
            // 4. init analytics
            api.dispatch(analyticsActions.init(action.payload.analytics, true));
            break;
        }
        case SUITE.CONNECT_INITIALIZED:
            // trezor-connect init successfully
            api.dispatch(blockchainActions.init());
            if (isWeb()) TrezorConnect.renderWebUSBButton();
            break;
        case BLOCKCHAIN.READY: {
            // dispatch initial location change
            api.dispatch(routerActions.init());
            // backend connected, suite is ready to use
            api.dispatch(suiteActions.onSuiteReady());
            // Set or clear Tor backends when Suite is ready
            const { tor } = api.getState().suite;
            if (tor) {
                await api.dispatch(walletSettingsActions.setTorBlockbookUrls());
            } else {
                api.dispatch(walletSettingsActions.clearTorBlockbookUrl());
            }
            break;
        }

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
        case SUITE.TOR_STATUS: {
            const { loaded } = api.getState().suite;
            if (!loaded) {
                break;
            }

            if (action.payload) {
                await api.dispatch(walletSettingsActions.setTorBlockbookUrls());
            } else {
                api.dispatch(walletSettingsActions.clearTorBlockbookUrl());
            }
            break;
        }
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
