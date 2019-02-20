/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';

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