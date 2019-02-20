/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { 
    PATH_CHANGE,
    KEY_CHANGE,
    VALUE_CHANGE,
    ENCRYPT_CHANGE,
    ASK_ENCRYPT_CHANGE,
    ASK_DECRYPT_CHANGE,
    IV_CHANGE
} from '../../actions/methods/CipherKeyValueActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    key: string;
    value: string;
    encrypt: boolean;
    askOnEncrypt: boolean;
    askOnDecrypt: boolean;
    iv: string; // initialization vector
}

const initialState: MethodState = {
    js: 'TrezorConnect.cipherKeyValue',
    fields: ['path', 'key', 'value', 'encrypt', 'askOnEncrypt', 'askOnDecrypt'],

    path: "m/49'/0'/0'",
    key: "My key",
    value: "1c0ffeec0ffeec0ffeec0ffeec0ffee1",
    encrypt: true,
    askOnEncrypt: true,
    askOnDecrypt: true,
    iv: ''
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

        case KEY_CHANGE :
            return {
                ...state,
                key: action.key
            };

        case VALUE_CHANGE :
            return {
                ...state,
                value: action.value
            };

        case ENCRYPT_CHANGE :
            return {
                ...state,
                encrypt: action.encrypt
            };

        case ASK_ENCRYPT_CHANGE :
            return {
                ...state,
                askOnEncrypt: action.askOnEncrypt
            };

        case ASK_DECRYPT_CHANGE :
            return {
                ...state,
                askOnDecrypt: action.askOnDecrypt
            };

        case IV_CHANGE :
            const fields = initialState.fields;
            if (action.iv.length > 0) fields.push('iv');

            return {
                ...state,
                fields,
                iv: action.iv
            };

        default:
            return state;
    }
}