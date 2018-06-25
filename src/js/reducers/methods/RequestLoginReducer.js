/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { IDENTITY_CHANGE, HIDDEN_CHANGE, VISUAL_CHANGE, CALLBACK_CHANGE } from '../../actions/methods/RequestLoginActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    identity: string; //(JSON)
    challengeHidden: string;
    challengeVisual: string;
    callback: string; //(function)
}

const defaultFn: string = `() => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                hidden: 'cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2',
                visual: 'Visual'
            })
        }, 3000)
    })
}`;

const defaultIdentity: string = `{
    "host": "http://example.cz",
    "index": 1,
    "path": "m/0",
    "port": "8088",
    "proto": "Proto",
    "user": "Username"
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.requestLogin',
    fields: ['identity', 'callback'],

    identity: defaultIdentity,
    challengeHidden: '',
    challengeVisual: '',
    callback: defaultFn,
};

const getFields = (state: MethodState): Array<string> => {
    const fields: Array<string> = [];
    if (state.identity.length > 0)
        fields.push('identity');
    
    if (state.challengeHidden.length > 0 || state.challengeVisual.length > 0) {
        fields.push('challengeHidden', 'challengeVisual');
    } else if (state.callback.length > 0) {
        fields.push('callback');
    }
    return fields;
}

export default function method(state: MethodState = initialState, action: any): any {

    let s: MethodState;
    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case IDENTITY_CHANGE :
            s = {
                ...state,
                identity: action.identity
            }
            return {
                ...s,
                fields: getFields(s)
            }

        case HIDDEN_CHANGE :
            s = {
                ...state,
                challengeHidden: action.hidden
            };
            return {
                ...s,
                fields: getFields(s)
            }

        case VISUAL_CHANGE :
            s = {
                ...state,
                challengeVisual: action.visual
            };
            return {
                ...s,
                fields: getFields(s)
            }

        case CALLBACK_CHANGE :
            s = {
                ...state,
                callback: action.callback
            };
            return {
                ...s,
                fields: getFields(s)
            }

        default:
            return state;
    }
}