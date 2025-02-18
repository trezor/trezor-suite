import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type {
    BuyListResponse,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
} from 'invity-api';

import { AmountLimitProps } from '../utils/buy/buyUtils';

export interface BuyInfo {
    buyInfo: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: string[];
    supportedCryptoCurrencies: CryptoId[];
}

export interface TradingBuyState {
    buyInfo?: BuyInfo;
    isFromRedirect: boolean;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    selectedQuote: BuyTrade | undefined;
    addressVerified: string | undefined;
    isLoading: boolean;
    amountLimits: AmountLimitProps | undefined;

    transactionId?: string;
}

export const buyInitialState: TradingBuyState = {
    transactionId: undefined,
    isFromRedirect: false,
    buyInfo: undefined,
    quotesRequest: undefined,
    selectedQuote: undefined,
    quotes: [],
    addressVerified: undefined,
    isLoading: false,
    amountLimits: undefined,
};

export const tradingBuySlice = createSlice({
    name: 'trading-buy',
    initialState: buyInitialState,
    reducers: {
        saveBuyInfo(state, action: PayloadAction<BuyInfo>) {
            state.buyInfo = action.payload;
        },
        setIsFromRedirect(state, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        saveQuoteRequest(state, action: PayloadAction<BuyTradeQuoteRequest>) {
            state.quotesRequest = action.payload;
        },
        saveTransactionId(state, action: PayloadAction<string>) {
            state.transactionId = action.payload;
        },
        saveQuotes(state, action: PayloadAction<BuyTrade[]>) {
            state.quotes = action.payload;
        },
        saveSelectedQuote(state, action: PayloadAction<BuyTrade | undefined>) {
            state.selectedQuote = action.payload;
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
        setIsLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(state, action: PayloadAction<AmountLimitProps | undefined>) {
            state.amountLimits = action.payload;
        },
    },
});

export const tradingBuyActions = tradingBuySlice.actions;
export const tradingBuyReducer = tradingBuySlice.reducer;
