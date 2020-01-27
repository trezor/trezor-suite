import produce from 'immer';
import { Action } from '@suite-types';
import { RATE_UPDATE, LAST_WEEK_RATES_UPDATE } from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';
import { Network } from '@wallet-types';

export interface CurrentFiatRates {
    symbol: Network['symbol'];
    rates: { [key: string]: number };
    ts: number;
}

export interface TimestampedRates {
    rates: { [key: string]: number };
    ts: number;
}

export interface LastWeekRates {
    tickers: TimestampedRates[];
    ts: number;
}

export interface CoinFiatRates {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
    symbol: Network['symbol'];
}

export const initialState: CoinFiatRates[] = [];

const updateCurrentRates = (state: CoinFiatRates[], current: CurrentFiatRates) => {
    const { symbol, rates } = current;
    const affected = state.find(f => f.symbol === symbol);
    console.log('affected', affected);
    // Object.keys(rates).map(k => rates[k].toFixed(2));

    if (!affected) {
        state.push({
            symbol,
            current,
            lastWeek: undefined,
        });
    } else {
        affected.current = current;
    }
};

const updateLastWeekRates = (
    state: CoinFiatRates[],
    payload: { symbol: Network['symbol']; tickers: TimestampedRates[]; ts: number },
) => {
    const affected = state.find(f => f.symbol === payload.symbol);
    // Object.keys(tickers).map(k => tickers[k].toFixed(2));

    if (!affected) {
        state.push({
            symbol: payload.symbol,
            current: undefined,
            lastWeek: payload,
        });
    } else {
        affected.lastWeek = payload;
    }
};

export default (state: CoinFiatRates[] = initialState, action: Action): CoinFiatRates[] => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_UPDATE:
                updateCurrentRates(draft, action.payload);
                break;
            case LAST_WEEK_RATES_UPDATE:
                updateLastWeekRates(draft, action.payload);
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.fiat;
            // no default
        }
    });
};
