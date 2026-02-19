import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { FiatCurrencyCode } from 'invity-api';
import type {
    BuyListResponse,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
} from 'invity-api';

import { AccountKey } from '@suite-common/wallet-types';

import { TRADING_BUY_PREFIX } from '../constants';
import { TradingAmountLimitProps } from '../types';

export interface BuyInfo {
    buyInfo: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: FiatCurrencyCode[];
    supportedCryptoCurrencies: CryptoId[];
}

export interface TradingBuyState {
    buyInfo?: BuyInfo;
    isFromRedirect: boolean;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    selectedQuote: BuyTrade | undefined;
    preselectedQuote: BuyTrade | undefined;
    tradingAccountKey?: AccountKey;
    receiveAddress?: string;
    isLoading: boolean;
    amountLimits: TradingAmountLimitProps | undefined;
    transactionId?: string;
    lastErrorMessage?: string;
}

export const buyInitialState: TradingBuyState = {
    transactionId: undefined,
    isFromRedirect: false,
    buyInfo: undefined,
    quotesRequest: undefined,
    selectedQuote: undefined,
    preselectedQuote: undefined,
    quotes: [],
    tradingAccountKey: undefined,
    receiveAddress: undefined,
    isLoading: false,
    amountLimits: undefined,
};

const tradingBuySlice = createSlice({
    name: TRADING_BUY_PREFIX,
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
        saveTransactionId(state, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuotes(state, action: PayloadAction<BuyTrade[]>) {
            state.quotes = action.payload;
        },
        savePreselectedQuote(state, action: PayloadAction<BuyTrade | undefined>) {
            state.preselectedQuote = action.payload;
        },
        saveSelectedQuote(state, action: PayloadAction<BuyTrade | undefined>) {
            state.selectedQuote = action.payload;
        },
        clearQuotes(state) {
            state.quotes = [];
        },
        setIsLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(state, action: PayloadAction<TradingAmountLimitProps | undefined>) {
            state.amountLimits = action.payload;
        },
        setTradingAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.tradingAccountKey = action.payload;
        },
        setReceiveAddress(state, action: PayloadAction<string | undefined>) {
            state.receiveAddress = action.payload;
        },
        setLastErrorMessage(state, action: PayloadAction<string | undefined>) {
            state.lastErrorMessage = action.payload;
        },
        clearQuotesAndParams(state) {
            state.quotes = [];
            state.quotesRequest = undefined;
            state.selectedQuote = undefined;
            state.preselectedQuote = undefined;
            state.amountLimits = undefined;
        },
    },
});

export const tradingBuyActions = tradingBuySlice.actions;
export const tradingBuyReducer = tradingBuySlice.reducer;
