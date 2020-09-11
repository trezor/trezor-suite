import produce from 'immer';
import { Action } from '@suite-types';
import {
    RATE_UPDATE,
    LAST_WEEK_RATES_UPDATE,
    RATE_REMOVE,
    FETCH_COIN_LIST_START,
    FETCH_COIN_LIST_SUCCESS,
    FETCH_COIN_LIST_FAIL,
} from '@wallet-actions/constants/fiatRatesConstants';
import { STORAGE } from '@suite-actions/constants';
import {
    CoinListItem,
    CoinFiatRates,
    CurrentFiatRates,
    LastWeekRates,
} from '@wallet-types/fiatRates';

export interface State {
    coins: CoinFiatRates[];
    coinList: CoinListItem[] | null;
}

export const initialState: State = {
    coins: [],
    coinList: null,
};

const remove = (state: CoinFiatRates[], symbol: string, mainNetworkSymbol?: string) => {
    const index = state.findIndex(
        f => f.symbol === symbol && f.mainNetworkSymbol === mainNetworkSymbol,
    );
    state.splice(index, 1);
};

const updateCurrentRates = (
    state: CoinFiatRates[],
    current: CurrentFiatRates,
    mainNetworkSymbol?: string,
) => {
    const { symbol } = current;
    const affected = state.find(
        f => f.symbol === symbol && f.mainNetworkSymbol === mainNetworkSymbol,
    );

    if (!affected) {
        state.push({
            symbol,
            mainNetworkSymbol,
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

const fiatRatesReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RATE_REMOVE:
                remove(draft.coins, action.symbol, action.mainNetworkSymbol);
                break;
            case RATE_UPDATE:
                updateCurrentRates(draft.coins, action.payload, action.mainNetworkSymbol);
                break;
            case LAST_WEEK_RATES_UPDATE:
                updateLastWeekRates(draft.coins, action.payload);
                break;
            case FETCH_COIN_LIST_START:
                draft.coinList = null;
                break;
            case FETCH_COIN_LIST_SUCCESS:
                draft.coinList = action.payload;
                break;
            case FETCH_COIN_LIST_FAIL:
                draft.coinList = null;
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.fiat;
            // no default
        }
    });
};

export default fiatRatesReducer;
