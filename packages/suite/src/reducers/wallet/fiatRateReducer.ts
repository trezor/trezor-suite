import produce from 'immer';
import { Action } from '@suite-types';
import { RATE_UPDATE, LAST_WEEK_RATES_UPDATE } from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';
import { Network } from '@wallet-types';

export interface CurrentFiatRates {
    symbol: string;
    rates: { [key: string]: number | undefined };
    ts: number;
}

export interface TimestampedRates {
    rates: { [key: string]: number | undefined };
    ts: number;
}

export interface LastWeekRates {
    tickers: TimestampedRates[];
    ts: number;
}

export interface CoinFiatRates {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
    symbol: string;
}

export const initialState: CoinFiatRates[] = [];

const updateCurrentRates = (state: CoinFiatRates[], current: CurrentFiatRates) => {
    const { symbol } = current;
    const affected = state.find(f => f.symbol === symbol);

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
    payload: { symbol: Network['symbol'] | string; tickers: TimestampedRates[]; ts: number },
) => {
    const affected = state.find(f => f.symbol === payload.symbol);

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
