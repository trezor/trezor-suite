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
        saveSellInfo(state: TradingSellState, action: PayloadAction<SellInfo>) {
            state.sellInfo = action.payload;
        },
        saveTransactionId(state: TradingSellState, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuoteRequest(
            state: TradingSellState,
            action: PayloadAction<SellFiatTradeQuoteRequest>,
        ) {
            state.quotesRequest = action.payload;
        },
        saveQuotes(state: TradingSellState, action: PayloadAction<SellFiatTrade[]>) {
            state.quotes = action.payload;
        },
        clearQuotes(state: TradingSellState) {
            state.quotes = [];
            state.selectedQuote = undefined;
        },
        saveSelectedQuote(
            state: TradingSellState,
            action: PayloadAction<SellFiatTrade | undefined>,
        ) {
            state.selectedQuote = action.payload;
        },
        setIsFromRedirect(state: TradingSellState, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        setTradingAccountKey(
            state: TradingSellState,
            action: PayloadAction<AccountKey | undefined>,
        ) {
            if (action.payload !== state.tradingAccountKey) {
                state.amountLimits = undefined;
            }
            state.tradingAccountKey = action.payload;
        },
        setIsLoading(state: TradingSellState, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(
            state: TradingSellState,
            action: PayloadAction<TradingAmountLimitProps | undefined>,
        ) {
            state.amountLimits = action.payload;
        },
        setFormStep(state: TradingSellState, action: PayloadAction<TradingSellStepType>) {
            state.formStep = action.payload;
        },
        setLastErrorMessage(state: TradingSellState, action: PayloadAction<string | undefined>) {
            state.lastErrorMessage = action.payload;
        },
        clearQuotesAndParams(state: TradingSellState) {
            state.quotes = [];
            state.quotesRequest = undefined;
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
        },
    },
});

export const tradingSellActions = tradingSellSlice.actions;
export const tradingSellReducer = tradingSellSlice.reducer;
