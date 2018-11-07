/* @flow */

import { RATE_UPDATE } from 'services/TickerService';

import type { Action } from 'flowtype';
import type { FiatRateAction } from 'services/TickerService';

export type Fiat = {
    +network: string;
    value: string;
}

export const initialState: Array<Fiat> = [];

const update = (state: Array<Fiat>, action: FiatRateAction): Array<Fiat> => {
    const newState: Array<Fiat> = [...state];
    newState.push({
        network: action.network,
        value: action.rate.current_price.usd,
    });
    console.log('newState', newState);
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