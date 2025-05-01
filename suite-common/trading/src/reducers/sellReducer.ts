import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { CryptoId, SellFiatTrade, SellFiatTradeQuoteRequest, SellProviderInfo } from 'invity-api';

import { AccountKey } from '@suite-common/wallet-types';

import { TRADING_SELL_PREFIX } from '../constants';
import { TradingAmountLimitProps, TradingSellStepType } from '../types';

export interface SellInfo {
    providerInfos: { [name: string]: SellProviderInfo };
    supportedFiatCurrencies: string[];
    supportedCryptoCurrencies: CryptoId[];
    country: string;
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
    },
});

export const tradingSellActions = tradingSellSlice.actions;
export const tradingSellReducer = tradingSellSlice.reducer;
