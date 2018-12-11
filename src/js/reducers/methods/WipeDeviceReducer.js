/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';

type MethodState = {
    +js: string;
    +fields: Array<string>;
}

const initialState: MethodState = {
    js: 'TrezorConnect.wipeDevice',
    fields: [],
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        default:
            return state;
    }
}