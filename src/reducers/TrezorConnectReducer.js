/* @flow */
import { TRANSPORT, UI } from 'trezor-connect';
import * as CONNECT from 'actions/constants/TrezorConnect';

import type { Action } from 'flowtype';

export type SelectedDevice = {
    id: string; // could be device path if unacquired or features.device_id
    instance: ?number;
}

export type State = {
    initialized: boolean;
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
    acquiringDevice: boolean;
}

const initialState: State = {
    initialized: false,
    error: null,
    transport: null,
    browserState: {},
    acquiringDevice: false,
};


export default function connect(state: State = initialState, action: Action): State {
    switch (action.type) {
        // trezor-connect iframe didn't loaded properly
        case CONNECT.INITIALIZATION_ERROR:
            return {
                ...state,
                error: action.error,
            };
        // trezor-connect iframe loaded
        case UI.IFRAME_HANDSHAKE:
            return {
                ...state,
                initialized: true,
                browserState: action.payload.browser,
            };
        // trezor-connect (trezor-link) initialized
        case TRANSPORT.START:
            return {
                ...state,
                transport: action.payload,
                error: null,
            };
        // trezor-connect (trezor-link)
        // will be called continuously in interval until connection (bridge/webusb) will be established
        case TRANSPORT.ERROR:
            return {
                ...state,
                // error: action.payload, // message is wrapped in "device" field. It's dispatched from TrezorConnect.on(DEVICE_EVENT...) in TrezorConnectService
                error: 'Transport is missing',
                transport: null,
            };

        case CONNECT.START_ACQUIRING:
            return {
                ...state,
                acquiringDevice: true,
            };

        case CONNECT.STOP_ACQUIRING:
            return {
                ...state,
                acquiringDevice: false,
            };

        default:
            return state;
    }
}