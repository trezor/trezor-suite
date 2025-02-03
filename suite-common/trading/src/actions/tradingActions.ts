import { createAction } from '@reduxjs/toolkit';
import { CryptoId, InfoResponse } from 'invity-api';

import { TradingComposedTransactionInfo } from '../reducers/tradingReducer';
import { TradingPaymentMethodListProps, TradingTransaction, TradingType } from '../types';

// TODO: maybe move to constants
const TRADING_COMMON_PREFIX = '@trading-common';
const INFO_COMMON_PREFIX = '@trading-info'; // TODO: unify with TRADING_COMMON_PREFIX

export const SAVE_COMPOSED_TRANSACTION_INFO = `${TRADING_COMMON_PREFIX}/save_composed_transaction_info`;
export const SAVE_TRADE = `${TRADING_COMMON_PREFIX}/save_trade`;
export const LOAD_DATA = `${TRADING_COMMON_PREFIX}/load_data`;
export const SET_LOADING = `${TRADING_COMMON_PREFIX}/set_loading`; // TODO: DEPRECATED?
export const SET_MODAL_CRYPTO_CURRENCY = `${TRADING_COMMON_PREFIX}/set_modal_crypto_currency`;
export const SET_MODAL_ACCOUNT_KEY = `${TRADING_COMMON_PREFIX}/set_modal_account_key`;
export const SET_TRADING_ACTIVE_SECTION = `${TRADING_COMMON_PREFIX}/set_trading_active_section`;
export const SET_TRADING_FROM_PREFILLED_CRYPTO_ID = `${TRADING_COMMON_PREFIX}/set_trading_from_prefilled_crypto_id`;

export const SAVE_SYMBOLS_INFO = `${INFO_COMMON_PREFIX}/save-info`;
export const SAVE_PAYMENT_METHODS = `${INFO_COMMON_PREFIX}/payment-methods`;

const saveInfo = createAction(SAVE_SYMBOLS_INFO, (payload: InfoResponse) => ({
    payload,
}));

const savePaymentMethods = createAction(
    SAVE_PAYMENT_METHODS,
    (payload: TradingPaymentMethodListProps[]) => ({
        payload,
    }),
);

const saveComposedTransactionInfo = createAction(
    SAVE_COMPOSED_TRANSACTION_INFO,
    (payload: TradingComposedTransactionInfo) => ({
        payload,
    }),
);

const saveTrade = createAction(SAVE_TRADE, (payload: TradingTransaction) => ({ payload }));

const loadInvityData = createAction(LOAD_DATA);

const setLoading = createAction(
    SET_LOADING,
    (isLoading: boolean, lastLoadedTimestamp?: number) => ({
        payload: {
            isLoading,
            lastLoadedTimestamp: lastLoadedTimestamp ?? 0,
        },
    }),
);

const setModalCryptoCurrency = createAction(SET_MODAL_CRYPTO_CURRENCY, (payload: CryptoId) => ({
    payload,
}));

const setModalAccountKey = createAction(SET_MODAL_ACCOUNT_KEY, (payload: string) => ({ payload }));

const setTradingActiveSection = createAction(
    SET_TRADING_ACTIVE_SECTION,
    (payload: TradingType) => ({ payload }),
);

const setTradingFromPrefilledCryptoId = createAction(
    SET_TRADING_FROM_PREFILLED_CRYPTO_ID,
    (payload: CryptoId | undefined) => ({ payload }),
);

export const tradingActions = {
    saveInfo,
    savePaymentMethods,
    saveComposedTransactionInfo,
    saveTrade,
    loadInvityData,
    setLoading,
    setModalCryptoCurrency,
    setModalAccountKey,
    setTradingActiveSection,
    setTradingFromPrefilledCryptoId,
};
