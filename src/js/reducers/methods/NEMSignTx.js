/* @flow */
'use strict';

import { NEM_TX__RESPONSE, RESPONSE_TAB_CHANGE } from '../../actions/methods/NEMSignTxActions';

type MethodState = {
    responseTab: string;
    response: ?Object;
    code: string;
    params: Object;
}

const initialState: MethodState = {
    responseTab: 'response',
    response: null,
    code: '',
    params: {}
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case RESPONSE_TAB_CHANGE :
            return {
                ...state,
                responseTab: action.tab
            };

        case NEM_TX__RESPONSE :
            return {
                ...state,
                response: action.response,
                responseTab: 'response'
            };

        default:
            return state;
    }
}