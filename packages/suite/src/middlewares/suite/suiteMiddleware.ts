import { MiddlewareAPI } from 'redux';

import { DEVICE } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';

import { SUITE, ROUTER } from 'src/actions/suite/constants';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { handleProtocolRequest } from 'src/actions/suite/protocolActions';
import { appChanged } from 'src/actions/suite/suiteActions';

const suite =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== prevApp) {
            api.dispatch(appChanged(action.payload.app));
        }

        // this action needs to be processed before propagation to deviceReducer
        // otherwise device will not be accessible and related data will not be removed (accounts, txs...)
        if (action.type === DEVICE.DISCONNECT) {
            api.dispatch(suiteActions.forgetDisconnectedDevices(action.payload));
        }

        // pass action to reducers
        next(action);

        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.protocol) {
                    api.dispatch(handleProtocolRequest(action.payload.protocol));
                }
                if (action.payload.desktopUpdate?.firstRun) {
                    api.dispatch(
                        notificationsActions.addToast({
                            type: 'auto-updater-new-version-first-run',
                            version: action.payload.desktopUpdate.firstRun,
                        }),
                    );
                }
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
