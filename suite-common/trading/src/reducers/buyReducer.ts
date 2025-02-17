import type {
    BuyListResponse,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
} from 'invity-api';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { tradingBuyActions } from '../actions/buyActions';

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
};

export const prepareBuyReducer = createReducerWithExtraDeps(buyInitialState, builder => {
    builder
        .addCase(tradingBuyActions.saveBuyInfo, (state, { payload }) => {
            state.buyInfo = payload;
        })
        .addCase(tradingBuyActions.setIsFromRedirect, (state, { payload }) => {
            state.isFromRedirect = payload;
        })
        .addCase(tradingBuyActions.saveQuoteRequest, (state, { payload }) => {
            state.quotesRequest = payload;
        })
        .addCase(tradingBuyActions.saveTransactionId, (state, { payload }) => {
            state.transactionId = payload;
        })
        .addCase(tradingBuyActions.saveQuotes, (state, { payload }) => {
            state.quotes = payload;
        })
        .addCase(tradingBuyActions.saveSelectedQuote, (state, { payload }) => {
            state.selectedQuote = payload;
        })
        .addCase(tradingBuyActions.clearQuotes, state => {
            state.quotes = [];
        })
        .addCase(tradingBuyActions.verifyAddress, (state, { payload }) => {
            state.addressVerified = payload;
        })
        .addCase(tradingBuyActions.dispose, state => {
            state.addressVerified = undefined;
        });
});
