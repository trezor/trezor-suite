/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { TAB_CHANGE, RESPONSE, UPDATE_CODE } from '../../actions/methods/CommonActions';

type MethodState = {
    tab: string;
    response: ?Object;
    code: string;
    params: Object;
}

const initialState: MethodState = {
    tab: 'response',
    response: null,
    code: '',
    params: {}
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case TAB_CHANGE :
            return {
                ...state,
                tab: action.tab
            }

        case RESPONSE :
            return {
                ...state,
                tab: 'response',
                response: action.response
            }

        case UPDATE_CODE :
            return {
                ...state,
                params: action.params,
                code: action.code
            }

        default:
            return state;
    }

}