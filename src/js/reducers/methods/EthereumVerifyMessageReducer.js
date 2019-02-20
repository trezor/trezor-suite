/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { PATH_CHANGE, MESSAGE_CHANGE, SIGNATURE_CHANGE, VERIFY_RESPONSE_VALUES } from '../../actions/methods/EthereumMessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    address: string;
    message: string;
    signature: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.ethereumVerifyMessage',
    fields: ['address', 'message', 'signature'],

    address: '',
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
                address: action.address,
                message: action.message,
                signature: action.signature
            }

        default:
            return state;
    }
}