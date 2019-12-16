import produce from 'immer';
import { FiatRateActions } from '@wallet-actions/fiatRatesActions';
import { RATE_UPDATE } from '@wallet-actions/constants/fiatRatesConstants';
import { Network } from '@wallet-types';

export interface Fiat {
    symbol: Network['symbol'];
    rates: { [key: string]: number };
    timestamp: number;
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
            timestamp: Date.now(),
        });
    } else {
        affected.symbol = symbol;
        affected.rates = rates;
        affected.timestamp = Date.now();
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
