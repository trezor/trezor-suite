/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { PATH_CHANGE, MESSAGE_CHANGE } from '../../actions/methods/EthereumMessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    message: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.ethereumSignMessage',
    fields: ['path', 'message'],

    path: "m/44'/60'/0'",
    message: 'Example message',
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        case MESSAGE_CHANGE :
            return {
                ...state,
                message: action.message
            };

        default:
            return state;
    }
}