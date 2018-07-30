/* @flow */


import { TRANSPORT, DEVICE, UI } from 'trezor-connect';
import type { Device } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as WALLET from '../actions/constants/wallet';

import type { Action, TrezorDevice } from '~/flowtype';

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
    acquiring: boolean;
}


const initialState: State = {
    // devices: [],
    //selectedDevice: null,
    discoveryComplete: false,
    error: null,
    transport: null,
    browserState: {},
    acquiring: false,
};


export default function connect(state: State = initialState, action: Action): State {
    switch (action.type) {
        case UI.IFRAME_HANDSHAKE:
            return {
                ...state,
                browserState: action.payload.browser,
            };

        case CONNECT.START_ACQUIRING:
            return {
                ...state,
                acquiring: true,
            };

        case CONNECT.STOP_ACQUIRING:
            return {
                ...state,
                acquiring: false,
            };

        case CONNECT.INITIALIZATION_ERROR:
            return {
                ...state,
                error: action.error,
            };

        case TRANSPORT.START:
            return {
                ...state,
                transport: action.payload,
                error: null,
            };

        case TRANSPORT.ERROR:
            return {
                ...state,
                // error: action.payload, // message is wrapped in "device" field. It's dispatched from TrezorConnect.on(DEVICE_EVENT...) in TrezorConnectService
                error: 'Transport is missing',
                transport: null,
            };


        default:
            return state;
    }
}