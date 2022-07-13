import { MiddlewareAPI } from 'redux';
import { DEVICE } from '@trezor/connect';
import { SUITE, STORAGE, ROUTER } from '@suite-actions/constants';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import * as analyticsActions from '@suite-actions/analyticsActions';
import * as storageActions from '@suite-actions/storageActions';
import * as messageSystemActions from '@suite-actions/messageSystemActions';
import * as languageActions from '@settings-actions/languageActions';
import * as trezorConnectActions from '@suite-actions/trezorConnectActions';
import { AppState, Action, Dispatch } from '@suite-types';
import { sortByTimestamp } from '@suite-utils/device';
import { handleProtocolRequest } from '@suite-actions/protocolActions';
import { addToast } from '@suite-actions/notificationActions';

const suite =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    async (action: Action): Promise<Action> => {
        const prevApp = api.getState().router.app;
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== prevApp) {
            api.dispatch({ type: SUITE.APP_CHANGED, payload: action.payload.app });
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (action.type === DEVICE.DISCONNECT) {
            api.dispatch(suiteActions.forgetDisconnectedDevices(action.payload));
        }

        // pass action to reducers
        next(action);

        switch (action.type) {
            case SUITE.INIT:
                await api.dispatch(storageActions.init());
                // load storage
                api.dispatch(storageActions.loadStorage());
                break;
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.protocol) {
                    api.dispatch(handleProtocolRequest(action.payload.protocol));
                }
                if (action.payload.desktopUpdate?.firstRun) {
                    api.dispatch(
                        addToast({
                            type: 'auto-updater-new-version-first-run',
                            version: action.payload.desktopUpdate.firstRun,
                        }),
                    );
                }
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
                        api.dispatch(suiteActions.toggleRememberDevice(d));
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
                // 1. init analytics
                api.dispatch(analyticsActions.init(action.payload.analytics));
                // 2. fetching locales
                // 3. fetch message system config
                // 4. redirecting user into welcome screen (if needed)
                await Promise.all([
                    api.dispatch(
                        languageActions.setLanguage(action.payload.suite.settings.language),
                    ),
                    api.dispatch(messageSystemActions.init()),
                    api.dispatch(routerActions.initialRedirection()),
                ]);
                // 5. init connect;
                api.dispatch(trezorConnectActions.init());
                break;
            }
            case SUITE.CONNECT_INITIALIZED:
                // @trezor/connect init successfully
                api.dispatch(blockchainActions.init());
                break;
            case BLOCKCHAIN.READY: {
                // dispatch initial location change
                api.dispatch(routerActions.init());
                // backend connected, suite is ready to use
                api.dispatch(suiteActions.onSuiteReady());
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
