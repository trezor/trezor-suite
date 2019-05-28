/* @flow */

import { RATE_UPDATE } from 'services/CoingeckoService';

import type { Action } from 'flowtype';
import type { FiatRateAction } from 'services/CoingeckoService';

export type Fiat = {
    +network: string,
    rates: { [string]: number },
};

export const initialState: Array<Fiat> = [];

const update = (state: Array<Fiat>, action: FiatRateAction): Array<Fiat> => {
    const affected = state.find(f => f.network === action.network);
    const otherRates = state.filter(d => d !== affected);
    const { network, rates } = action;

    Object.keys(rates).map(k => rates[k].toFixed(2));

    return otherRates.concat([
        {
            network,
            rates,
        },
    ]);
};

export default (state: Array<Fiat> = initialState, action: Action): Array<Fiat> => {
    switch (action.type) {
        case RATE_UPDATE:
            return update(state, action);

        default:
            return state;
    }
};
