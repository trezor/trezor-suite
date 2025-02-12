import { createAction } from '@reduxjs/toolkit';
import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';

import { BuyInfo } from '../reducers/buyReducer';
import { AmountLimitProps } from '../utils/buy/buyUtils';

const BUY_COMMON_PREFIX = '@trading-buy';

const saveBuyInfo = createAction(`${BUY_COMMON_PREFIX}/save_buy_info`, (payload: BuyInfo) => ({
    payload,
}));

const dispose = createAction(`${BUY_COMMON_PREFIX}/dispose`);

const setIsFromRedirect = createAction(
    `${BUY_COMMON_PREFIX}/set_is_from_redirect`,
    (payload: boolean) => ({ payload }),
);

const saveTransactionId = createAction(
    `${BUY_COMMON_PREFIX}/save_transaction_id`,
    (payload: string) => ({
        payload,
    }),
);

const saveQuoteRequest = createAction(
    `${BUY_COMMON_PREFIX}/save_buy_quote_request`,
    (payload: BuyTradeQuoteRequest) => ({
        payload,
    }),
);

const saveQuotes = createAction(`${BUY_COMMON_PREFIX}/save_buy_quotes`, (payload: BuyTrade[]) => ({
    payload,
}));

const saveSelectedQuote = createAction(
    `${BUY_COMMON_PREFIX}/save_buy_quote`,
    (payload: BuyTrade | undefined) => ({
        payload,
    }),
);

const clearQuotes = createAction(`${BUY_COMMON_PREFIX}/clear_buy_quotes`);

const verifyAddress = createAction(
    `${BUY_COMMON_PREFIX}/verify_address`,
    (payload: string | undefined) => ({ payload }),
);

const setIsLoading = createAction(`${BUY_COMMON_PREFIX}/set_is_loading`, (payload: boolean) => ({
    payload,
}));

const setAmountLimits = createAction(
    `${BUY_COMMON_PREFIX}/set_amount_limits`,
    (payload: AmountLimitProps | undefined) => ({
        payload,
    }),
);

export const tradingBuyActions = {
    saveBuyInfo,
    dispose,
    setIsFromRedirect,
    saveTransactionId,
    saveQuoteRequest,
    saveQuotes,
    saveSelectedQuote,
    clearQuotes,
    verifyAddress,
    setIsLoading,
    setAmountLimits,
};
