import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    type BuyListResponse,
    type BuyProviderInfo,
    type BuyTrade,
    type BuyTradeQuoteRequest,
    type CryptoId,
    type FiatCurrencyCode,
} from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
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
    preselectedQuote: BuyTrade | undefined;
    tradingAccountKey?: AccountKey;
    receiveAccountKey?: AccountKey;
    receiveAddress?: string;
    receiveSymbol?: NetworkSymbol;
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
    receiveAccountKey: undefined,
    receiveAddress: undefined,
    receiveSymbol: undefined,
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
        setReceiveAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.receiveAccountKey = action.payload;
        },
        setReceiveAddress(
            state,
            action: PayloadAction<{
                address: string | undefined;
                symbol: NetworkSymbol | undefined;
            }>,
        ) {
            state.receiveAddress = action.payload.address;
            state.receiveSymbol = action.payload.symbol;
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
