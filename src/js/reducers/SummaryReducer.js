/* @flow */
'use strict';

import * as SUMMARY from '../actions/constants/summary';

export type State = {
    +deviceState: ?string;
    +accountIndex: ?number;
    +network: ?string;
    location: string;

    details: boolean;
    selectedToken: any;
}

export const initialState: State = {
    deviceState: null,
    accountIndex: null,
    network: null,
    location: '',

    details: true,
    selectedToken: null
};


export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case SUMMARY.INIT :
            return action.state;

        case SUMMARY.DISPOSE :
            return initialState;

        case SUMMARY.DETAILS_TOGGLE :
            return {
                ...state,
                details: !state.details
            }

        default:
            return state;
    }

}