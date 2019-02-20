/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { COIN_CHANGE, PATH_CHANGE, MESSAGE_CHANGE, SIGNATURE_CHANGE, VERIFY_RESPONSE_VALUES } from '../../actions/methods/MessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    coin: string;
    address: string;
    message: string;
    signature: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.verifyMessage',
    fields: ['address', 'message', 'signature', 'coin'],

    coin: 'btc',
    address: '',
    message: '',
    signature: '',
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        // case LOCATION_CHANGE :
        //     return initialState;

        case COIN_CHANGE :
            return {
                ...state,
                coin: action.coin
            };

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
                coin: action.coin,
                address: action.address,
                message: action.message,
                signature: action.signature
            }

        default:
            return state;
    }
}