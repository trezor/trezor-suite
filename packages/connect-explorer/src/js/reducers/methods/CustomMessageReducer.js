/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { MESSAGES_CHANGE, MESSAGE_CHANGE, PARAMS_CHANGE, CALLBACK_CHANGE } from '../../actions/methods/CustomMessageActions';

import messages from '../../data/custom.messages';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    messages: string;
    message: string;
    params: string;
    callback: string;
}

const defaultParams: string = `{
    "address_n": [2147483694, 2147483708, 2147483648],
    "num_operations": 1
}`;

const defaultFn: string = `(request) => {
    if (request.type === 'StellarTxOpRequest') {
        return {
            message: 'StellarPaymentOp',
            params: { }
        }
    }
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.customMessage',
    fields: ['message', 'params', 'callback', 'messages'],

    messages: JSON.stringify(messages, undefined, 2),
    message: 'StellarSignTx',
    params: defaultParams,
    callback: defaultFn,
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case MESSAGES_CHANGE :
            return {
                ...state,
                messages: action.messages
            };

        case MESSAGE_CHANGE :
            return {
                ...state,
                message: action.message
            };

        case PARAMS_CHANGE :
            return {
                ...state,
                params: action.params
            };

        case CALLBACK_CHANGE :
            return {
                ...state,
                callback: action.callback
            };

        default:
            return state;
    }
}