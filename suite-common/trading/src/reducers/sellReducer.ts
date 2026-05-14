import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    type CryptoId,
    type SellFiatTrade,
    type SellFiatTradeQuoteRequest,
    type SellProviderInfo,
} from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';

import { TRADING_SELL_PREFIX } from '../constants';
import {
    type TradingAmountLimitProps,
    type TradingCountryCode,
    type TradingSellStepType,
} from '../types';

export interface SellInfo {
    providerInfos: { [name: string]: SellProviderInfo };
    supportedFiatCurrencies: string[];
    supportedCryptoCurrencies: CryptoId[];
    country: TradingCountryCode;
    countrySubdivision?: string;
}

export type TradingSellState = {
    sellInfo?: SellInfo;
    quotesRequest?: SellFiatTradeQuoteRequest;
    quotes: SellFiatTrade[];
    selectedQuote: SellFiatTrade | undefined;
    isFromRedirect: boolean;
    // internal selected account key in trading section
    tradingAccountKey?: AccountKey;
    isLoading: boolean;
    amountLimits: TradingAmountLimitProps | undefined;
    formStep: TradingSellStepType;
    transactionId?: string;
    lastErrorMessage?: string;
};

export const sellInitialState: TradingSellState = {
    sellInfo: undefined,
    quotesRequest: undefined,
    quotes: [],
    selectedQuote: undefined,
    transactionId: undefined,
    isFromRedirect: false,
    tradingAccountKey: undefined,
    isLoading: false,
    amountLimits: undefined,
    formStep: 'BANK_ACCOUNT',
};

const tradingSellSlice = createSlice({
    name: TRADING_SELL_PREFIX,
    initialState: sellInitialState,
    reducers: {
        saveSellInfo(state, action: PayloadAction<SellInfo>) {
            state.sellInfo = action.payload;
        },
        saveTransactionId(state, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuoteRequest(state, action: PayloadAction<SellFiatTradeQuoteRequest>) {
            state.quotesRequest = action.payload;
        },
        saveQuotes(state, action: PayloadAction<SellFiatTrade[]>) {
            state.quotes = action.payload;
        },
        saveSelectedQuote(state, action: PayloadAction<SellFiatTrade | undefined>) {
            state.selectedQuote = action.payload;
        },
        setIsFromRedirect(state, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        setTradingAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.tradingAccountKey = action.payload;
        },
        setIsLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(state, action: PayloadAction<TradingAmountLimitProps | undefined>) {
            state.amountLimits = action.payload;
        },
        setFormStep(state, action: PayloadAction<TradingSellStepType>) {
            state.formStep = action.payload;
        },
        setLastErrorMessage(state, action: PayloadAction<string | undefined>) {
            state.lastErrorMessage = action.payload;
        },
        clearQuotesAndParams(state) {
            state.quotes = [];
            state.quotesRequest = undefined;
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
        },
    },
});

export const tradingSellActions = tradingSellSlice.actions;
export const tradingSellReducer = tradingSellSlice.reducer;
