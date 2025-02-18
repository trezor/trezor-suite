import { AnyAction } from '@reduxjs/toolkit';
import { Coins, CryptoId, Platforms } from 'invity-api';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';

import { TradingPaymentMethodListProps, TradingTransaction, TradingType } from '../types';
import { TradingBuyState, buyInitialState, tradingBuyReducer } from './buyReducer';
import { tradingActions } from '../actions/tradingActions';

export interface TradingComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        'feePerByte' | 'estimatedFeeLimit' | 'feeLimit' | 'token' | 'fee'
    >;
    selectedFee?: FeeLevel['label'];
}

export interface TradingInfo {
    platforms?: Platforms;
    coins?: Coins;
    paymentMethods: TradingPaymentMethodListProps[];
}

export interface TradingState {
    info: TradingInfo;
    buy: TradingBuyState;
    // exchange: TradingExchangeState;
    // sell: TradingSellState;
    composedTransactionInfo: TradingComposedTransactionInfo;
    trades: TradingTransaction[];
    modalCryptoId: CryptoId | undefined;
    modalAccountKey: AccountKey | undefined;
    isLoading: boolean;
    lastLoadedTimestamp: number;
    activeSection?: TradingType;
    prefilledFromCryptoId: CryptoId | undefined;
}

export const initialState: TradingState = {
    info: {
        platforms: undefined,
        coins: undefined,
        paymentMethods: [],
    },
    buy: buyInitialState,
    /*
    exchange: {
        exchangeInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        quotes: [],
        addressVerified: undefined,
        tradingAccountKey: undefined,
        selectedQuote: undefined,
        isFromRedirect: false,
    },
    sell: {
        sellInfo: undefined,
        quotesRequest: undefined,
        quotes: [],
        selectedQuote: undefined,
        transactionId: undefined,
        isFromRedirect: false,
        tradingAccountKey: undefined,
    },
    */
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalAccountKey: undefined,
    modalCryptoId: undefined,
    lastLoadedTimestamp: 0,
    activeSection: 'buy',
    prefilledFromCryptoId: undefined,
};

export const prepareTradingReducer = createReducerWithExtraDeps(initialState, (builder, extra) => {
    builder
        .addCase(extra.actionTypes.storageLoad, (state, action: AnyAction) => ({
            ...state,
            trades: action.payload.tradingTrades ?? state.trades,
        }))
        .addCase(tradingActions.saveInfo, (state, { payload }) => {
            state.info.coins = payload.coins;
            state.info.platforms = payload.platforms;
        })
        .addCase(tradingActions.savePaymentMethods, (state, { payload }) => {
            state.info.paymentMethods = payload;
        })
        .addCase(tradingActions.saveComposedTransactionInfo, (state, { payload }) => {
            state.composedTransactionInfo = payload;
        })
        .addCase(tradingActions.setTradingFromPrefilledCryptoId, (state, { payload }) => {
            state.prefilledFromCryptoId = payload;
        })
        .addCase(tradingActions.saveTrade, (state, { payload }) => {
            if (payload.key) {
                const trades = state.trades.filter(t => t.key !== payload.key);
                trades.push(payload);

                state.trades = trades;
            }
        })
        .addCase(tradingActions.setLoading, (state, { payload }) => {
            state.isLoading = payload.isLoading;
            state.lastLoadedTimestamp = payload.lastLoadedTimestamp;
        })
        .addCase(tradingActions.setModalAccountKey, (state, { payload }) => {
            state.modalAccountKey = payload;
        })
        .addCase(tradingActions.setModalCryptoCurrency, (state, { payload }) => {
            state.modalCryptoId = payload;
        })
        .addCase(tradingActions.setTradingActiveSection, (state, { payload }) => {
            state.activeSection = payload;
        })
        .addDefaultCase((state, action) => {
            tradingBuyReducer(state.buy, action);
            // TODO: prepareSellReducer(extra)(state.sell, action);
            // TODO: prepareExchangeReducer(extra)(state.exchange, action);
        });
});
