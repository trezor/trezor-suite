import {
    CoinFiatRates,
    CurrentFiatRates,
    LastWeekRates,
    TickerId,
} from '@suite-common/wallet-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { fiatRatesActions } from './fiatRatesActions';

export interface FiatRatesState {
    coins: CoinFiatRates[];
}

export const fiatRatesInitialState: FiatRatesState = {
    coins: [],
};

export type FiatRatesRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
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

export const prepareFiatRatesReducer = createReducerWithExtraDeps(
    fiatRatesInitialState,
    (builder, extra) => {
        builder
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFiatRates)
            .addCase(fiatRatesActions.removeFiatRate, (state, action) => {
                remove(state.coins, action.payload);
            })
            .addCase(fiatRatesActions.updateFiatRate, (state, action) => {
                const { ticker, payload } = action.payload;
                updateCurrentRates(state.coins, ticker, payload);
            })
            .addCase(fiatRatesActions.updateLastWeekRates, (state, action) => {
                updateLastWeekRates(state.coins, action.payload);
            });
    },
);

export const selectCoins = (state: FiatRatesRootState) => state.wallet.fiat.coins;
