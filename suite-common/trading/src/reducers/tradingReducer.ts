import { AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { Coins, CryptoId, InfoResponse, Platforms } from 'invity-api';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';

import { TradingPaymentMethodListProps, TradingTransaction, TradingType } from '../types';
import { TradingBuyState, buyInitialState, tradingBuyReducer } from './buyReducer';

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

export const tradingSlice = createSliceWithExtraDeps({
    name: 'trading-common',
    initialState,
    reducers: {
        saveInfo(state, action: PayloadAction<InfoResponse>) {
            state.info.coins = action.payload.coins;
            state.info.platforms = action.payload.platforms;
        },
        savePaymentMethods(state, action: PayloadAction<TradingPaymentMethodListProps[]>) {
            state.info.paymentMethods = action.payload;
        },
        saveComposedTransactionInfo(state, action: PayloadAction<TradingComposedTransactionInfo>) {
            state.composedTransactionInfo = action.payload;
        },
        saveTrade(state, action: PayloadAction<TradingTransaction>) {
            if (action.payload.key) {
                const trades = state.trades.filter(t => t.key !== action.payload.key);
                trades.push(action.payload);

                state.trades = trades;
            }
        },
        setModalCryptoCurrency(state, action: PayloadAction<CryptoId>) {
            state.modalCryptoId = action.payload;
        },
        setModalAccountKey(state, action: PayloadAction<string>) {
            state.modalAccountKey = action.payload;
        },
        setLoading(
            state,
            action: PayloadAction<{ isLoading: boolean; lastLoadedTimestamp?: number }>,
        ) {
            state.isLoading = action.payload.isLoading;
            state.lastLoadedTimestamp = action.payload.lastLoadedTimestamp ?? 0;
        },
        setTradingActiveSection(state, action: PayloadAction<TradingType>) {
            state.activeSection = action.payload;
        },
        setTradingFromPrefilledCryptoId(state, action: PayloadAction<CryptoId | undefined>) {
            state.prefilledFromCryptoId = action.payload;
        },
    },
    extraReducers: (builder, extra) => {
        builder

            .addCase(extra.actionTypes.storageLoad, (state, action: AnyAction) => ({
                ...state,
                trades: action.payload.tradingTrades ?? state.trades,
            }))
            .addDefaultCase((state, action) => {
                tradingBuyReducer(state.buy, action);
                // TODO: prepareSellReducer(extra)(state.sell, action);
                // TODO: prepareExchangeReducer(extra)(state.exchange, action);
            });
    },
});

export const prepareTradingReducer = tradingSlice.prepareReducer;
export const tradingActions = tradingSlice.actions;
