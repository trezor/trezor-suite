import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    CryptoId,
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
} from 'invity-api';

import { AccountKey } from '@suite-common/wallet-types';

import { TRADING_EXCHANGE_PREFIX } from '../constants';
import { TradingExchangeAmountLimitProps } from '../types';

export interface ExchangeInfo {
    exchangeList?: ExchangeListResponse; // TODO: trading - is this needed?
    providerInfos: Record<string, ExchangeProviderInfo>;
    buyCryptoIds: CryptoId[];
    sellCryptoIds: CryptoId[];
}

export type TradingExchangeState = {
    exchangeInfo?: ExchangeInfo;
    quotesRequest?: ExchangeTradeQuoteRequest;
    quotes: ExchangeTrade[];
    addressVerified: string | undefined;
    // internal selected account key in trading section
    tradingAccountKey?: AccountKey;
    selectedQuote: ExchangeTrade | undefined;
    isFromRedirect: boolean;
    isLoading: boolean;
    amountLimits: TradingExchangeAmountLimitProps | undefined;

    transactionId?: string;
};

export const exchangeInitialState: TradingExchangeState = {
    exchangeInfo: undefined,
    transactionId: undefined,
    quotesRequest: undefined,
    quotes: [],
    addressVerified: undefined,
    tradingAccountKey: undefined,
    selectedQuote: undefined,
    isFromRedirect: false,
    isLoading: false,
    amountLimits: undefined,
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
        verifyAddress(state, action: PayloadAction<string | undefined>) {
            state.addressVerified = action.payload;
        },
        dispose(state) {
            state.addressVerified = undefined;
        },
        setTradingAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.tradingAccountKey = action.payload;
        },
        saveSelectedQuote(state, action: PayloadAction<ExchangeTrade | undefined>) {
            state.selectedQuote = action.payload;
        },
        setIsFromRedirect(state, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        setIsLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(state, action: PayloadAction<TradingExchangeAmountLimitProps | undefined>) {
            state.amountLimits = action.payload;
        },
    },
});

export const tradingExchangeActions = tradingExchangeSlice.actions;
export const tradingExchangeReducer = tradingExchangeSlice.reducer;
