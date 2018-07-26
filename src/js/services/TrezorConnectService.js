/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';

import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { updateCode } from '../actions/methods/CommonActions';

let inited: boolean = false;

const TrezorConnectService = store => next => action => {
    // Pass all actions through by default
    next(action);

    if (action.type === LOCATION_CHANGE || action.type.indexOf('_@change') > 0) {
        store.dispatch( updateCode() );
    }

    if (action.type === LOCATION_CHANGE && !inited) {
        inited = true;

        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            // post event to reducer
            store.dispatch({
                type: event.type,
                device: event.payload
            });
        });

        // TrezorConnect.on(TRANSPORT_EVENT, (event) => {
        //     console.warn("-------TRANSPOOOO", event)
        // })

        window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : 'https://sisyfos.trezor.io/connect/';

        // const src = typeof LOCAL === 'string' ? LOCAL : 'https://sisyfos.trezor.io/next/';
        /// const src = 'https://sisyfos.trezor.io/next/';

        
        /*
        TrezorConnect.init({
            connectSrc: src,
            // connectSrc: 'https://localhost:8088/',
            // connectSrc: 'https://sisyfos.trezor.io/next/',

            webusb: true,
            // transportReconnect: false,
            popup: true,
            debug: true,
            // excludedDevices: ["web02"]
        })
        // .then(r => {
        //     console.warn("INIT", r);
        //     TrezorConnect.getPublicKey({ path: "m/44"});
        // })
        .catch(error => {
            console.log("ERROR", error);
        })
        */

        
        
        
        

       // TrezorConnect.getPublicKey({ path: "m/44"});
        
        // .catch(error => {
        //     // TODO: show some ui with errors
        //     console.log("ERROR", error);
        // });

            // handle UI events only if TrezorConnect isn't using popup
            TrezorConnect.on(UI_EVENT, (event: DeviceMessage): void => {
                // post event to reducer
                store.dispatch({
                    type: event.type,
                    data: event.payload
                });
            });


        
    }
};

export default TrezorConnectService;