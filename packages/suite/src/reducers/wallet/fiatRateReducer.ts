import { RATE_UPDATE, FiatRateActions } from '@wallet-middlewares/coingeckoMiddleware';
import produce from 'immer';

export interface Fiat {
    symbol: string;
    rates: { [key: string]: number };
}

export const initialState: Fiat[] = [];

const update = (state: Fiat[], action: FiatRateActions) => {
    const { symbol, rates } = action;
    const affected = state.find(f => f.symbol === symbol);

    Object.keys(rates).map(k => rates[k].toFixed(2));
    if (!affected) {
        state.push({
            symbol,
            rates,
        });
    } else {
        affected.symbol = symbol;
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
