/* @flow */
'use strict';

export type Fiat = {
    +network: string;
    value: string;
}

export const initialState: Array<Fiat> = [];

const update = (state: Array<Fiat>, action: any): Array<Fiat> => {
    const newState: Array<Fiat> = [ ...state ];
    const exists: ?Fiat = newState.find(f => f.network === action.network);
    if (exists) {
        exists.value = action.rate.price_usd;
    } else {
        newState.push({
            network: action.network,
            value: action.rate.price_usd
        })
    }
    return newState;
}


export default (state: Array<Fiat> = initialState, action: any): Array<Fiat> => {

    switch (action.type) {

        case 'rate__update' :
            return update(state, action);

        default:
            return state;
    }

}