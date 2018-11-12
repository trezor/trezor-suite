/* @flow */

import { RATE_UPDATE } from 'services/CoingeckoService';

import type { Action } from 'flowtype';
import type { FiatRateAction } from 'services/CoingeckoService';

export type Fiat = {
    +network: string;
    value: string;
};

export const initialState: Array<Fiat> = [];

const update = (state: Array<Fiat>, action: FiatRateAction): Array<Fiat> => {
    const newState: Array<Fiat> = [...state];
    let exists: ?Fiat = newState.find(f => f.network === action.network);
    const { network, rate } = action;

    if (exists) {
        exists = {
            network,
            value: rate,
        };
    } else {
        newState.push({
            network,
            value: rate,
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