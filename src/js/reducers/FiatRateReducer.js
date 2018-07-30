/* @flow */


import { RATE_UPDATE } from '../services/CoinmarketcapService';

import type { Action } from '~/flowtype';
import type { FiatRateAction } from '../services/CoinmarketcapService';

export type Fiat = {
    +network: string;
    value: string;
}

export const initialState: Array<Fiat> = [];

const update = (state: Array<Fiat>, action: FiatRateAction): Array<Fiat> => {
    const newState: Array<Fiat> = [...state];
    const exists: ?Fiat = newState.find(f => f.network === action.network);
    if (exists) {
        exists.value = action.rate.price_usd;
    } else {
        newState.push({
            network: action.network,
            value: action.rate.price_usd,
        });
    }
    return newState;
};


export default (state: Array<Fiat> = initialState, action: Action): Array<Fiat> => {
    switch (action.type) {
        case RATE_UPDATE:
            return update(state, action);

        default:
            return state;
    }
};