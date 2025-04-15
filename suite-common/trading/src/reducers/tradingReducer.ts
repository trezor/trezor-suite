import { PayloadAction } from '@reduxjs/toolkit';
import { Coins, CryptoId, InfoResponse, Platforms } from 'invity-api';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';

import { TradingPaymentMethodListProps, TradingTransaction, TradingType } from '../types';
import { TradingBuyState, buyInitialState, tradingBuyReducer } from './buyReducer';
import { TRADING_PREFIX } from '../constants';
import { buyThunks, exchangeThunks } from '../thunks';
import {
    TradingExchangeState,
    exchangeInitialState,
    tradingExchangeReducer,
} from './exchangeReducer';

export interface TradingComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        | 'feePerByte'
        | 'estimatedFeeLimit'
        | 'feeLimit'
        | 'token'
        | 'fee'
        | 'maxFeePerGas'
        | 'maxPriorityFeePerGas'
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
    exchange: TradingExchangeState;
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
    exchange: exchangeInitialState,
    // sell: sellInitialState,
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalAccountKey: undefined,
    modalCryptoId: undefined,
    lastLoadedTimestamp: 0,
    activeSection: 'buy',
    prefilledFromCryptoId: undefined,
};

type StorageActionPayload = {
    tradingTrades?: TradingTransaction[];
};

export const tradingSlice = createSliceWithExtraDeps({
    name: TRADING_PREFIX,
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
        setModalAccountKey(state, action: PayloadAction<string | undefined>) {
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
            .addCase(
                extra.actionTypes.storageLoad,
                (state, action: PayloadAction<StorageActionPayload>) => ({
                    ...state,
                    trades: action.payload.tradingTrades ?? state.trades,
                }),
            )
            .addCase(buyThunks.handleRequestThunk.pending, state => {
                state.buy.isLoading = true;
            })
            .addCase(buyThunks.handleRequestThunk.fulfilled, state => {
                state.buy.isLoading = false;
            })
            .addCase(exchangeThunks.handleRequestThunk.pending, state => {
                state.exchange.isLoading = true;
            })
            .addCase(exchangeThunks.handleRequestThunk.fulfilled, state => {
                state.exchange.isLoading = false;
            })
            .addCase(exchangeThunks.confirmTradeThunk.pending, state => {
                state.exchange.isLoading = true;
            })
            .addCase(exchangeThunks.confirmTradeThunk.fulfilled, state => {
                state.exchange.isLoading = false;
            })
            .addDefaultCase((state, action) => {
                tradingBuyReducer(state.buy, action);
                // TODO: prepareSellReducer(extra)(state.sell, action);
                tradingExchangeReducer(state.exchange, action);
            });
    },
});

export const prepareTradingReducer = tradingSlice.prepareReducer;
export const tradingActions = tradingSlice.actions;
