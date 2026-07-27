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
        saveExchangeInfo(state: TradingExchangeState, action: PayloadAction<ExchangeInfo>) {
            state.exchangeInfo = action.payload;
        },
        saveTransactionId(state: TradingExchangeState, action: PayloadAction<string | undefined>) {
            state.transactionId = action.payload;
        },
        saveQuoteRequest(
            state: TradingExchangeState,
            action: PayloadAction<ExchangeTradeQuoteRequest>,
        ) {
            state.quotesRequest = action.payload;
        },
        saveQuotes(state: TradingExchangeState, action: PayloadAction<ExchangeTrade[]>) {
            state.quotes = action.payload;
        },
        clearQuotes(state: TradingExchangeState) {
            state.quotes = [];
            state.selectedQuote = undefined;
        },
        setTradingAccountKey(
            state: TradingExchangeState,
            action: PayloadAction<AccountKey | undefined>,
        ) {
            state.tradingAccountKey = action.payload;
        },
        setReceiveAccountKey(
            state: TradingExchangeState,
            action: PayloadAction<AccountKey | undefined>,
        ) {
            state.receiveAccountKey = action.payload;
        },
        setReceiveAddress(state: TradingExchangeState, action: PayloadAction<string | undefined>) {
            state.receiveAddress = action.payload;
        },
        setExtraField(state: TradingExchangeState, action: PayloadAction<string | undefined>) {
            state.extraField = action.payload;
        },
        saveSelectedQuote(
            state: TradingExchangeState,
            action: PayloadAction<ExchangeTrade | undefined>,
        ) {
            state.selectedQuote = action.payload;
        },
        setSelectedQuoteSwapSlippage(state: TradingExchangeState, action: PayloadAction<string>) {
            if (state.selectedQuote?.isDex) {
                state.selectedQuote.swapSlippage = action.payload;
            }
        },
        setIsFromRedirect(state: TradingExchangeState, action: PayloadAction<boolean>) {
            state.isFromRedirect = action.payload;
        },
        setIsLoading(state: TradingExchangeState, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setDexQuoteApprovalPrefetchLoadingQuoteId(
            state: TradingExchangeState,
            action: PayloadAction<string | undefined>,
        ) {
            state.dexQuoteApprovalPrefetchLoadingQuoteId = action.payload;
        },
        setAmountLimits(
            state: TradingExchangeState,
            action: PayloadAction<TradingExchangeAmountLimitProps | undefined>,
        ) {
            state.amountLimits = action.payload;
        },
        setFormStep(state: TradingExchangeState, action: PayloadAction<TradingExchangeStepType>) {
            state.formStep = action.payload;
        },
        setLastErrorMessage(
            state: TradingExchangeState,
            action: PayloadAction<string | undefined>,
        ) {
            state.lastErrorMessage = action.payload;
        },
    },
});

export const tradingExchangeActions = tradingExchangeSlice.actions;
export const tradingExchangeReducer = tradingExchangeSlice.reducer;
