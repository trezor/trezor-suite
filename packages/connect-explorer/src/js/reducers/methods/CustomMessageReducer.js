/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { FN_CHANGE } from '../../actions/methods/CustomMessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    customFunction: string;
}

const initialState: MethodState = {
    js: 'TrezorConnect.customMessage',
    fields: ['customFunction'],

    customFunction: '',
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case FN_CHANGE :
            return {
                ...state,
                customFunction: action.customFunction
            };

        default:
            return state;
    }
}