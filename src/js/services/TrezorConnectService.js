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

        try {
            TrezorConnect.init({
                // connectSrc: 'https://localhost:8088/',
                connectSrc: 'https://sisyfos.trezor.io/next/',

                // webusb: false,
                // transportReconnect: false,
                popup: true,
                debug: false,
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