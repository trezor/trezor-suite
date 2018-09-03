/* @flow */
import { push } from 'react-router-redux';

import {
    TRANSPORT, DEVICE,
} from 'trezor-connect';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import * as DiscoveryActions from 'actions/DiscoveryActions';
import * as ModalActions from 'actions/ModalActions';
import * as STORAGE from 'actions/constants/localStorage';
import * as CONNECT from 'actions/constants/TrezorConnect';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Action,
} from 'flowtype';

const TrezorConnectService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // const prevState: $ElementType<State, 'connect'> = api.getState().connect;
    const prevModalState: $ElementType<State, 'modal'> = api.getState().modal;
    // const prevRouterState: $ElementType<State, 'router'> = api.getState().router;

    next(action);

    if (action.type === STORAGE.READY) {
        api.dispatch(TrezorConnectActions.init());
    } else if (action.type === TRANSPORT.ERROR) {
        // TODO: check if modal is open
        // api.dispatch( push('/') );
    } else if (action.type === TRANSPORT.START) {
        api.dispatch(TrezorConnectActions.postInit());
    } else if (action.type === DEVICE.DISCONNECT) {
        api.dispatch(TrezorConnectActions.deviceDisconnect(action.device));
    } else if (action.type === CONNECT.REMEMBER_REQUEST) {
        api.dispatch(ModalActions.onRememberRequest(prevModalState));
    } else if (action.type === CONNECT.FORGET) {
        //api.dispatch( TrezorConnectActions.forgetDevice(action.device) );
        api.dispatch(TrezorConnectActions.switchToFirstAvailableDevice());
    } else if (action.type === CONNECT.FORGET_SINGLE) {
        if (api.getState().devices.length < 1 && action.device.connected) {
            // prompt disconnect device info in LandingPage
            api.dispatch({
                type: CONNECT.DISCONNECT_REQUEST,
                device: action.device,
            });
            api.dispatch(push('/'));
        } else {
            api.dispatch(TrezorConnectActions.switchToFirstAvailableDevice());
        }
    } else if (action.type === DEVICE.CONNECT || action.type === DEVICE.CONNECT_UNACQUIRED) {
        api.dispatch(DiscoveryActions.restore());
        api.dispatch(ModalActions.onDeviceConnect(action.device));
    } else if (action.type === CONNECT.AUTH_DEVICE) {
        api.dispatch(DiscoveryActions.check());
    } else if (action.type === CONNECT.DUPLICATE) {
        api.dispatch(TrezorConnectActions.onSelectDevice(action.device));
    } else if (action.type === CONNECT.COIN_CHANGED) {
        api.dispatch(TrezorConnectActions.coinChanged(action.payload.network));
    }

    return action;
};

export default TrezorConnectService;