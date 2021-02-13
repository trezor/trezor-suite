import produce from 'immer';
import { Action } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    RATE_REMOVE,
} from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';
import { CoinFiatRates, CurrentFiatRates, LastWeekRates, TickerId } from '@wallet-types/fiatRates';

export interface State {
    coins: CoinFiatRates[];
}

export const initialState: State = {
    coins: [],
};

const remove = (state: CoinFiatRates[], payload: TickerId) => {
    const index = state.findIndex(
        f =>
            f.symbol === payload.symbol &&
            f.mainNetworkSymbol === payload.mainNetworkSymbol &&
            f.tokenAddress === payload.tokenAddress,
    );
    state.splice(index, 1);
};

const updateCurrentRates = (
    state: CoinFiatRates[],
    ticker: TickerId,
    payload: CurrentFiatRates,
) => {
    const { symbol, mainNetworkSymbol, tokenAddress } = ticker;
    const affected = state.find(
        f =>
            f.symbol === symbol &&
            f.mainNetworkSymbol === mainNetworkSymbol &&
            f.tokenAddress === tokenAddress,
    );

    if (!affected) {
        state.push({
            ...ticker,
            current: payload,
            lastWeek: undefined,
        });
    } else {
        affected.current = payload;
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

const fiatRatesReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_REMOVE:
                remove(draft.coins, action.payload);
                break;
            case RATE_UPDATE:
                updateCurrentRates(draft.coins, action.ticker, action.payload);
                break;
            case LAST_WEEK_RATES_UPDATE:
                updateLastWeekRates(draft.coins, action.payload);
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.fiat;
            // no default
        }
    });
};

export default fiatRatesReducer;
