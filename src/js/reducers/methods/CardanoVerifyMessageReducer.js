/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { PATH_CHANGE, MESSAGE_CHANGE, SIGNATURE_CHANGE, VERIFY_RESPONSE_VALUES } from '../../actions/methods/CardanoMessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    publicKey: string;
    message: string;
    signature: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.cardanoVerifyMessage',
    fields: ['publicKey', 'message', 'signature'],

    publicKey: '',
    message: '',
    signature: '',
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        // case LOCATION_CHANGE :
        //     return initialState;

        case PATH_CHANGE :
            return {
                ...state,
                address: action.path
            };

        case MESSAGE_CHANGE :
            return {
                ...state,
                message: action.message
            };

        case SIGNATURE_CHANGE :
            return {
                ...state,
                signature: action.signature
            };

        case VERIFY_RESPONSE_VALUES : 
            return {
                ...state,
                publicKey: action.publicKey,
                message: action.message,
                signature: action.signature
            }

        default:
            return state;
    }
}