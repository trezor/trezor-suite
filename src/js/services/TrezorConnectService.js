/* @flow */
'use strict';

import { LOCATION_CHANGE, push } from 'react-router-redux';

import TrezorConnect, { TRANSPORT, DEVICE_EVENT, UI_EVENT, UI, DEVICE } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import * as DiscoveryActions from '../actions/DiscoveryActions';
import * as ModalActions from '../actions/ModalActions';
import { init as initWeb3 } from '../actions/Web3Actions';
import * as WEB3 from '../actions/constants/web3';
import * as STORAGE from '../actions/constants/localStorage';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as NOTIFICATION from '../actions/constants/notification';
import * as MODAL from '../actions/constants/modal';


const TrezorConnectService = (store: any) => (next: any) => (action: any) => {

    const prevState = store.getState().connect;
    const prevModalState = store.getState().modal;
    const prevRouterState = store.getState().router;

    next(action);

    if (action.type === STORAGE.READY) {
        store.dispatch( TrezorConnectActions.init() );

    } else if (action.type === TRANSPORT.ERROR) {
        // TODO: check if modal is open
        // store.dispatch( push('/') );
    // } else if (action.type === TRANSPORT.START && store.getState().web3.length > 0 && prevState.devices.length > 0) {
    //     store.dispatch( TrezorConnectActions.postInit() );
    } else if (action.type === TRANSPORT.START && store.getState().web3.length < 1) {
        //store.dispatch( TrezorConnectActions.postInit() );
        store.dispatch( initWeb3() );
    } else if (action.type === WEB3.READY) {
        store.dispatch( TrezorConnectActions.postInit() );
    } else if (action.type === TRANSPORT.UNREADABLE) {
        store.dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Unreadable HID device',
                message: '',
                cancelable: true,
            }
        });
    } else if (action.type === DEVICE.DISCONNECT) {
        store.dispatch( TrezorConnectActions.deviceDisconnect(action.device) );

    } else if (action.type === CONNECT.REMEMBER_REQUEST) {
       // TODO: 2 modals at once
        if (prevModalState.opened && prevModalState.windowType === CONNECT.REMEMBER_REQUEST) {
            store.dispatch({
                type: CONNECT.FORGET,
                device: store.getState().modal.device
            });

            store.dispatch({
                type: CONNECT.FORGET,
                device: prevModalState.device
            });
        }

    } else if (action.type === CONNECT.FORGET) {
        //store.dispatch( TrezorConnectActions.forgetDevice(action.device) );
        store.dispatch( TrezorConnectActions.switchToFirstAvailableDevice() );
    } else if (action.type === CONNECT.FORGET_SINGLE) {

        //store.dispatch( TrezorConnectActions.forgetDevice(action.device) );

        if (store.getState().connect.devices.length < 1 && action.device.connected) {
            // prompt disconnect device modal
            store.dispatch({
                type: CONNECT.DISCONNECT_REQUEST,
                device: action.device
            });
        } else {
            store.dispatch( TrezorConnectActions.switchToFirstAvailableDevice() );
        }
    } else if (action.type === DEVICE.CHANGED) {
        // selected device was previously unacquired, but now it's acquired
        // we need to change route 
        if (prevState.selectedDevice) {
            if (!action.device.unacquired && action.device.path === prevState.selectedDevice.id) {
                console.warn("TODO: here! better")
                store.dispatch( TrezorConnectActions.onSelectDevice(action.device) );
            }
        }
    } else if (action.type === DEVICE.CONNECT || action.type === DEVICE.CONNECT_UNACQUIRED) {

        store.dispatch( DiscoveryActions.restore() );

        // interrupt process of remembering device (force forget)
        // TODO: the same for disconnect more than 1 device at once
        // TODO: move it to modal actions
        const { modal } = store.getState();
        if (modal.opened && modal.windowType === CONNECT.REMEMBER_REQUEST) {
            if (action.device.features && modal.device.features.device_id === action.device.features.device_id) {
                store.dispatch({
                    type: MODAL.CLOSE,
                });
            } else {
                store.dispatch({
                    type: CONNECT.FORGET,
                    device: modal.device
                });
            }
        }

    } else if (action.type === CONNECT.AUTH_DEVICE) {
        store.dispatch( DiscoveryActions.check() );

    } else if (action.type === CONNECT.DUPLICATE) {
        store.dispatch( TrezorConnectActions.onDuplicateDevice() );

    } else if (action.type === DEVICE.ACQUIRED || action.type === CONNECT.SELECT_DEVICE) {
        console.warn("here!!!!!", action.type)
        store.dispatch( TrezorConnectActions.getSelectedDeviceState() );

    } else if (action.type === CONNECT.COIN_CHANGED) {
        store.dispatch( TrezorConnectActions.coinChanged( action.payload.network ) );
    }
}

export default TrezorConnectService;