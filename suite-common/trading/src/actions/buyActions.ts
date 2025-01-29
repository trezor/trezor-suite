import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';
import { createAction } from '@reduxjs/toolkit';

import { BuyInfo } from '../reducers/buyReducer';

const BUY_COMMON_PREFIX = '@trading-common';

export const SAVE_BUY_INFO = `${BUY_COMMON_PREFIX}/save_buy_info`;
export const SAVE_QUOTE_REQUEST = `${BUY_COMMON_PREFIX}/save_buy_quote_request`;
export const SAVE_TRANSACTION_DETAIL_ID = `${BUY_COMMON_PREFIX}/save_transaction_detail_id`;
export const SET_IS_FROM_REDIRECT = `${BUY_COMMON_PREFIX}/set_is_from_redirect`;
export const SAVE_QUOTES = `${BUY_COMMON_PREFIX}/save_buy_quotes`;
export const SAVE_QUOTE = `${BUY_COMMON_PREFIX}/save_buy_quote`;
export const CLEAR_QUOTES = `${BUY_COMMON_PREFIX}/clear_buy_quotes`;
export const VERIFY_ADDRESS = `${BUY_COMMON_PREFIX}/verify_address`;
export const SAVE_TRANSACTION_ID = `${BUY_COMMON_PREFIX}/save_transaction_id`;
export const DISPOSE = `${BUY_COMMON_PREFIX}/dispose`;

const saveBuyInfo = createAction(SAVE_BUY_INFO, (payload: BuyInfo) => ({ payload }));

const dispose = createAction(DISPOSE);

const setIsFromRedirect = createAction(SET_IS_FROM_REDIRECT, (payload: boolean) => ({ payload }));

const saveTransactionDetailId = createAction(SAVE_TRANSACTION_DETAIL_ID, (payload: string) => ({
    payload,
}));

const saveQuoteRequest = createAction(SAVE_QUOTE_REQUEST, (payload: BuyTradeQuoteRequest) => ({
    payload,
}));

const saveQuotes = createAction(SAVE_QUOTES, (payload: BuyTrade[]) => ({ payload }));

const saveSelectedQuote = createAction(SAVE_QUOTE, (payload: BuyTrade | undefined) => ({
    payload,
}));

const clearQuotes = createAction(CLEAR_QUOTES);

// TODO: verifyAddress thunk
const verifyAddress = createAction(VERIFY_ADDRESS, (payload: string | undefined) => ({ payload }));

export const tradingBuyActions = {
    saveBuyInfo,
    dispose,
    setIsFromRedirect,
    saveTransactionDetailId,
    saveQuoteRequest,
    saveQuotes,
    saveSelectedQuote,
    clearQuotes,
    verifyAddress,
};
