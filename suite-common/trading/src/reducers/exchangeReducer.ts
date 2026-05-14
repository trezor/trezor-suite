import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    type CryptoId,
    type ExchangeProviderInfo,
    type ExchangeTrade,
    type ExchangeTradeQuoteRequest,
} from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_PREFIX } from '../constants';
import { type TradingExchangeAmountLimitProps, type TradingExchangeStepType } from '../types';

export interface ExchangeInfo {
    providerInfos: Record<string, ExchangeProviderInfo>;
    buyCryptoIds: CryptoId[];
    sellCryptoIds: CryptoId[];
}

export interface TradingExchangeState {
    exchangeInfo?: ExchangeInfo;
    quotesRequest?: ExchangeTradeQuoteRequest;
    quotes: ExchangeTrade[];
    // internal selected account key in trading section
    tradingAccountKey?: AccountKey;
    receiveAccountKey?: AccountKey;
    receiveAddress?: string;
    extraField?: string;
    selectedQuote: ExchangeTrade | undefined;
    preselectedQuote: ExchangeTrade | undefined;
    isFromRedirect: boolean;
    isLoading: boolean;
    dexQuoteApprovalPrefetchLoadingQuoteId: string | undefined;
    amountLimits: TradingExchangeAmountLimitProps | undefined;
    formStep: TradingExchangeStepType;
    transactionId?: string;
    lastErrorMessage?: string;
}

export const exchangeInitialState: TradingExchangeState = {
    exchangeInfo: undefined,
    transactionId: undefined,
    quotesRequest: undefined,
    quotes: [],
    tradingAccountKey: undefined,
    receiveAccountKey: undefined,
    receiveAddress: undefined,
    extraField: undefined,
    selectedQuote: undefined,
    preselectedQuote: undefined,
    isFromRedirect: false,
    isLoading: false,
    dexQuoteApprovalPrefetchLoadingQuoteId: undefined,
    amountLimits: undefined,
    formStep: 'RECEIVING_ADDRESS',
};

const tradingExchangeSlice = createSlice({
    name: TRADING_EXCHANGE_PREFIX,
    initialState: exchangeInitialState,
    reducers: {
        saveExchangeInfo(state, action: PayloadAction<ExchangeInfo>) {
            state.exchangeInfo = action.payload;
        },
        saveTransactionId(state, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuoteRequest(state, action: PayloadAction<ExchangeTradeQuoteRequest>) {
            state.quotesRequest = action.payload;
        },
        saveQuotes(state, action: PayloadAction<ExchangeTrade[]>) {
            state.quotes = action.payload;
        },
        clearQuotes(state) {
            state.quotes = [];
        },
        setTradingAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.tradingAccountKey = action.payload;
        },
        setReceiveAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.receiveAccountKey = action.payload;
        },
        setReceiveAddress(state, action: PayloadAction<string | undefined>) {
            state.receiveAddress = action.payload;
        },
        setExtraField(state, action: PayloadAction<string | undefined>) {
            state.extraField = action.payload;
        },
        saveSelectedQuote(state, action: PayloadAction<ExchangeTrade | undefined>) {
            state.selectedQuote = action.payload;
        },
        savePreselectedQuote(state, action: PayloadAction<ExchangeTrade | undefined>) {
            state.preselectedQuote = action.payload;
        },
        setIsFromRedirect(state, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        setIsLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setDexQuoteApprovalPrefetchLoadingQuoteId(
            state,
            action: PayloadAction<string | undefined>,
        ) {
            state.dexQuoteApprovalPrefetchLoadingQuoteId = action.payload;
        },
        setAmountLimits(state, action: PayloadAction<TradingExchangeAmountLimitProps | undefined>) {
            state.amountLimits = action.payload;
        },
        setFormStep(state, action: PayloadAction<TradingExchangeStepType>) {
            state.formStep = action.payload;
        },
        setLastErrorMessage(state, action: PayloadAction<string | undefined>) {
            state.lastErrorMessage = action.payload;
        },
    },
});

export const tradingExchangeActions = tradingExchangeSlice.actions;
export const tradingExchangeReducer = tradingExchangeSlice.reducer;
