/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';

import TrezorConnect, { TRANSPORT_EVENT, DEVICE_EVENT, UI_EVENT, UI, DEVICE } from 'trezor-connect';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import { updateCode } from '../actions/methods/CommonActions';
import { getQueryVariable } from '../utils/windowUtils';

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
        const customSrc = getQueryVariable('src');
        if (customSrc) {
            window.__TREZOR_CONNECT_SRC = customSrc;
        } else {
            window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : undefined;
        }
        window.TrezorConnect = TrezorConnect;

        // TrezorConnect.init({

        //     webusb: true,
        //     // transportReconnect: false,
        //     popup: true,
        //     debug: true,
        //     // excludedDevices: ["web02"]
        //     manifest: {
        //         email: 'ab'
        //     }
        // })
        // .catch(error => {
        //     console.log("ERROR", error);
        // })

        TrezorConnect.manifest({
            email: 'abcd@xyz.com',
            appUrl: 'www.'
        })

        
        
        
        

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

            TrezorConnect.on(UI.ADDRESS_VALIDATION, (data: any) => {
                console.warn("HANDLE EVENT", data)
                // store.dispatch({
                //     type: UI.ADDRESS_VALIDATION,
                //     data
                // })
            })


        
    }
};

export default TrezorConnectService;