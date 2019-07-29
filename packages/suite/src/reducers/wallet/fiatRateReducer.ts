import { RATE_UPDATE } from '@wallet-services/CoingeckoService';
import { Actions } from '@wallet-types/index';
import produce from 'immer';

export interface Fiat {
    network: string;
    rates: { [key: string]: number };
}

export const initialState: Fiat[] = [];

const update = (state: Fiat[], action: Actions) => {
    const affected = state.find(f => f.network === action.network);
    const { network, rates } = action;

    Object.keys(rates).map(k => rates[k].toFixed(2));
    if (!affected) {
        state.push({
            network,
            rates,
        });
    } else {
        affected.network = network;
        affected.rates = rates;
    }
};

export default (state: Fiat[] = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_UPDATE:
                update(draft, action);
                break;
            // no default
        }
    });
};
