import produce from 'immer';
import { Action } from '@suite-types';
import { RATE_UPDATE } from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';
import { Network } from '@wallet-types';

export interface Fiat {
    symbol: Network['symbol'];
    rates: { [key: string]: number };
    timestamp: number;
}

export const initialState: Fiat[] = [];

const update = (state: Fiat[], fiat: Pick<Fiat, 'symbol' | 'rates'>) => {
    const { symbol, rates } = fiat;
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

export default (state: Fiat[] = initialState, action: Action): Fiat[] => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_UPDATE:
                update(draft, { symbol: action.symbol, rates: action.rates });
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.fiat;
            // no default
        }
    });
};
