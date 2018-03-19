/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';

import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';

let inited: boolean = false;

const TrezorConnectService = store => next => action => {
    // Pass all actions through by default
    next(action);

    if (action.type === LOCATION_CHANGE && !inited) {
        inited = true;

        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                device: event.payload
            });

            console.warn("-------DEVICEEE", event)
        });

        TrezorConnect.on(TRANSPORT_EVENT, (event) => {
            console.warn("-------TRANSPOOOO", event)
        })

        try {
            TrezorConnect.init({
                // iframeSrc: 'https://localhost:8088/iframe.html',
                // popupSrc: 'https://localhost:8088/popup.html',
                iframeSrc: 'https://dev.trezor.io/connect5/iframe.html',
                popupSrc: 'https://dev.trezor.io/connect5/popup.html',
                // webusb: false,
                // transportReconnect: false,
                //popup: false,
                debug: true,
            })
            .then(r => {
                // post action inited
            })
        } catch (E) {
            console.log("ERROR", E);
        }
        
        // .catch(error => {
        //     // TODO: show some ui with errors
        //     console.log("ERROR", error);
        // });

        

        const version: Object = TrezorConnect.getVersion();

        if (version.type === 'library') {
            // handle UI events only if TrezorConnect isn't using popup
            TrezorConnect.on(UI_EVENT, (event: DeviceMessage): void => {
                // post event to reducer
                store.dispatch({
                    type: event.type,
                    data: event.payload
                });
            });
        }

        
    }
};

export default TrezorConnectService;