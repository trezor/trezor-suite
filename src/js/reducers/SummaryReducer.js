/* @flow */
'use strict';

import * as SUMMARY from '../actions/constants/summary';

export type State = {
    details: boolean;
    selectedToken: any;
}

export const initialState: State = {
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