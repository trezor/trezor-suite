import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    type BuyListResponse,
    type BuyProviderInfo,
    type BuyTrade,
    type BuyTradeQuoteRequest,
    type CryptoId,
    type FiatCurrencyCode,
} from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';

import { TRADING_BUY_PREFIX } from '../constants';
import { type TradingAmountLimitProps } from '../types';

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
    tradingAccountKey?: AccountKey;
    receiveAccountKey?: AccountKey;
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
    quotes: [],
    tradingAccountKey: undefined,
    receiveAccountKey: undefined,
    receiveAddress: undefined,
    isLoading: false,
    amountLimits: undefined,
};

const tradingBuySlice = createSlice({
    name: TRADING_BUY_PREFIX,
    initialState: buyInitialState,
    reducers: {
        saveBuyInfo(state: TradingBuyState, action: PayloadAction<BuyInfo>) {
            state.buyInfo = action.payload;
        },
        setIsFromRedirect(state: TradingBuyState, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        saveQuoteRequest(state: TradingBuyState, action: PayloadAction<BuyTradeQuoteRequest>) {
            state.quotesRequest = action.payload;
        },
        saveTransactionId(state: TradingBuyState, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuotes(state: TradingBuyState, action: PayloadAction<BuyTrade[]>) {
            state.quotes = action.payload;
        },
        saveSelectedQuote(state: TradingBuyState, action: PayloadAction<BuyTrade | undefined>) {
            state.selectedQuote = action.payload;
        },
        clearQuotes(state: TradingBuyState) {
            state.quotes = [];
            state.selectedQuote = undefined;
        },
        setIsLoading(state: TradingBuyState, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setAmountLimits(
            state: TradingBuyState,
            action: PayloadAction<TradingAmountLimitProps | undefined>,
        ) {
            state.amountLimits = action.payload;
        },
        setTradingAccountKey(
            state: TradingBuyState,
            action: PayloadAction<AccountKey | undefined>,
        ) {
            if (action.payload !== state.tradingAccountKey) {
                state.amountLimits = undefined;
            }
            state.tradingAccountKey = action.payload;
        },
        setReceiveAccountKey(
            state: TradingBuyState,
            action: PayloadAction<AccountKey | undefined>,
        ) {
            state.receiveAccountKey = action.payload;
        },
        setReceiveAddress(state: TradingBuyState, action: PayloadAction<string | undefined>) {
            state.receiveAddress = action.payload;
        },
        setLastErrorMessage(state: TradingBuyState, action: PayloadAction<string | undefined>) {
            state.lastErrorMessage = action.payload;
        },
        clearQuotesAndParams(state: TradingBuyState) {
            state.quotes = [];
            state.quotesRequest = undefined;
            state.selectedQuote = undefined;
            state.amountLimits = undefined;
        },
    },
});

export const tradingBuyActions = tradingBuySlice.actions;
export const tradingBuyReducer = tradingBuySlice.reducer;
