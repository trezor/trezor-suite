/* @flow */
'use strict';

import { TRANSPORT, DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as WALLET from '../actions/constants/wallet';

import type { Action, TrezorDevice } from '~/flowtype';
import type { Device } from 'trezor-connect';

export type SelectedDevice = {
    id: string; // could be device path if unacquired or features.device_id
    instance: ?number;
}

export type State = {
    // devices: Array<TrezorDevice>;
    // selectedDevice: ?SelectedDevice;
    discoveryComplete: boolean;
    error: ?string;
    transport: ?{
        type: string;
        version: string;
    };
    // browserState: {
    //     name: string;
    //     osname: string;
    //     supported: boolean;
    //     outdated: boolean;
    //     mobile: boolean;
    // } | {};
    browserState: any;
}


const initialState: State = {
    // devices: [],
    //selectedDevice: null,
    discoveryComplete: false,
    error: null,
    transport: null,
    browserState: {}
};



export default function connect(state: State = initialState, action: Action): State {

    switch (action.type) {

        // TODO: change it to UiMessage from trezor-connect
        case 'iframe_handshake' : 
            return {
                ...state,
                browserState: action.payload.browser
            }
        

        case CONNECT.INITIALIZATION_ERROR :
            return {
                ...state,
                error: action.error
            };

        case TRANSPORT.START :
            return {
                ...state,
                transport: action.payload,
                error: null
            }

        case TRANSPORT.ERROR :
            return {
                ...state,
                // error: action.payload, // message is wrapped in "device" field. It's dispatched from TrezorConnect.on(DEVICE_EVENT...) in TrezorConnectService
                error: "Transport is missing",
                transport: null,
            };


        default:
            return state;
    }

}