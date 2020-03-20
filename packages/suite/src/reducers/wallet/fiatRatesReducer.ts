import produce from 'immer';
import { Action } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    RATE_REMOVE,
} from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';

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
    symbol: string;
    tickers: TimestampedRates[];
    ts: number;
}

export interface CoinFiatRates {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
    symbol: string;
}

export const initialState: CoinFiatRates[] = [];

const remove = (state: CoinFiatRates[], symbol: string) => {
    const index = state.findIndex(f => f.symbol === symbol);
    state.splice(index, 1);
};

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

const updateLastWeekRates = (state: CoinFiatRates[], payload: LastWeekRates) => {
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
            case RATE_REMOVE:
                remove(draft, action.symbol);
                break;
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
