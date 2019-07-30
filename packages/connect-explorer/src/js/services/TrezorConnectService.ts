/* eslint-disable no-underscore-dangle */

import { LOCATION_CHANGE } from 'connected-react-router';
import TrezorConnect, {
    TRANSPORT_EVENT,
    DEVICE_EVENT,
    UI_EVENT,
    UI,
    DeviceEvent,
    UiEvent,
    TransportEvent,
} from 'trezor-connect';
import { getQueryVariable } from '../utils/windowUtils';

declare const LOCAL: string;

let inited = false;

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

        TrezorConnect.on(DEVICE_EVENT, (event: DeviceEvent): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                device: event.payload,
            });
        });

        TrezorConnect.on(TRANSPORT_EVENT, (event: TransportEvent) => {
            console.warn('TRANSPORT_EVENT', event);
            // this type of event should not be emitted in "popup mode"
        });

        TrezorConnect.on(UI_EVENT, (event: UiEvent): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                data: event.payload,
            });
        });

        // @ts-ignore connect
        TrezorConnect.on(UI.ADDRESS_VALIDATION, (data: any) => {
            // This needs to be explicity set to make address validation work
        });

        TrezorConnect.init({
            connectSrc: 'https://sisyfos.sldev.cz/connect-electron/',
            webusb: true,
            // transportReconnect: false,
            popup: true,
            debug: true,
            lazyLoad: true,
            manifest: {
                email: 'info@trezor.io',
                appUrl: window.location.host,
            },
            // @ts-ignore connect
        }).catch(error => {
            console.log('ERROR', error);
        });
    }
};

export default TrezorConnectService;
