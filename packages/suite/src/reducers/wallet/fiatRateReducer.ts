import { RATE_UPDATE, FiatRateActions } from '@wallet-middlewares/coingeckoMiddleware';
import produce from 'immer';

export interface Fiat {
    network: string;
    rates: { [key: string]: number };
}

export const initialState: Fiat[] = [];

const update = (state: Fiat[], action: FiatRateActions) => {
    const { network, rates } = action;
    const affected = state.find(f => f.network === network);

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

export default (state: Fiat[] = initialState, action: FiatRateActions) => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_UPDATE:
                update(draft, action);
                break;
            // no default
        }
    });
};
