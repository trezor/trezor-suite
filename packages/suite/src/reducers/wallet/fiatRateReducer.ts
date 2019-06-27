import { RATE_UPDATE, FiatRateAction } from '@wallet-services/CoingeckoService';

import { Action } from '@suite-types/index';

export interface Fiat {
    network: string;
    rates: { [key: string]: number };
}

export const initialState: Fiat[] = [];

const update = (state: Fiat[], action: FiatRateAction): Fiat[] => {
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

export default (state: Fiat[] = initialState, action: Action): Fiat[] => {
    switch (action.type) {
        case RATE_UPDATE:
            return update(state, action);

        default:
            return state;
    }
};
