/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';

import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI, DEVICE } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { getQueryVariable } from '../utils/windowUtils';

let inited: boolean = false;

const TrezorConnectService = store => next => action => {
    // Pass all actions through by default
    next(action);

    if (action.type === LOCATION_CHANGE && !inited) {
        inited = true;

        const customSrc = getQueryVariable('src');
        if (customSrc) {
            window.__TREZOR_CONNECT_SRC = customSrc;
        } else {
            window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : undefined;
        }
        window.TrezorConnect = TrezorConnect;

        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                device: event.payload
            });
        });

        TrezorConnect.on(TRANSPORT_EVENT, (event) => {
            console.warn("TRANSPORT_EVENT", event)
            // this type of event should not be emitted in "popup mode"
        });

        TrezorConnect.on(UI_EVENT, (event: DeviceMessage): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                data: event.payload
            });
        });

        TrezorConnect.on(UI.ADDRESS_VALIDATION, (data: any) => {
            // This needs to be explicity set to make address validation work
        });

        TrezorConnect.manifest({
            email: 'info@trezor.io',
            appUrl: window.location.host
        });

        TrezorConnect.init({
            // connectSrc: 'http://localhost:8000/',
            webusb: true,
            // transportReconnect: false,
            popup: true,
            debug: true,
            lazyLoad: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: window.location.host
            }
        })
        .catch(error => {
            console.log("ERROR", error);
        });
    }
};

export default TrezorConnectService;