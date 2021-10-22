/* eslint-disable no-underscore-dangle */

import { MiddlewareAPI } from 'redux';
import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI } from 'trezor-connect';

import { Dispatch, AppState, Action } from '../types';
import { getQueryVariable } from '../utils/windowUtils';

let inited = false;

export const trezorConnectMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        // Pass all actions through by default
        next(action);

        if (!inited) {
            inited = true;

            const customSrc = getQueryVariable('src');
            if (customSrc) {
                window.__TREZOR_CONNECT_SRC = customSrc;
            }
            window.TrezorConnect = TrezorConnect;

            TrezorConnect.on(DEVICE_EVENT, event => {
                // post event to reducer
                api.dispatch({
                    type: event.type,
                    device: event.payload,
                });
            });

            TrezorConnect.on(TRANSPORT_EVENT, event => {
                console.warn('TRANSPORT_EVENT', event);
                // this type of event should not be emitted in "popup mode"
            });

            TrezorConnect.init({
                // connectSrc: 'http://localhost:8000/',
                connectSrc: 'https://localhost:8088/',
                webusb: true,
                transportReconnect: true,
                popup: true,
                debug: true,
                lazyLoad: true,
                manifest: {
                    email: 'info@trezor.io',
                    appUrl: '@trezor/suite',
                },
            }).catch(error => {
                console.log('ERROR', error);
            });
        }
    };
