import { createAction } from '@reduxjs/toolkit';
import { CryptoId, InfoResponse } from 'invity-api';

import { TradingComposedTransactionInfo } from '../reducers/tradingReducer';
import { TradingPaymentMethodListProps, TradingTransaction, TradingType } from '../types';

const TRADING_COMMON_PREFIX = '@trading-common';

const saveInfo = createAction(`${TRADING_COMMON_PREFIX}/save-info`, (payload: InfoResponse) => ({
    payload,
}));

const savePaymentMethods = createAction(
    `${TRADING_COMMON_PREFIX}/payment-methods`,
    (payload: TradingPaymentMethodListProps[]) => ({
        payload,
    }),
);

const saveComposedTransactionInfo = createAction(
    `${TRADING_COMMON_PREFIX}/save_composed_transaction_info`,
    (payload: TradingComposedTransactionInfo) => ({
        payload,
    }),
);

const saveTrade = createAction(
    `${TRADING_COMMON_PREFIX}/save_trade`,
    (payload: TradingTransaction) => ({ payload }),
);

const loadInvityData = createAction(`${TRADING_COMMON_PREFIX}/load_data`);

const setLoading = createAction(
    `${TRADING_COMMON_PREFIX}/set_loading`,
    (isLoading: boolean, lastLoadedTimestamp?: number) => ({
        payload: {
            isLoading,
            lastLoadedTimestamp: lastLoadedTimestamp ?? 0,
        },
    }),
);

const setModalCryptoCurrency = createAction(
    `${TRADING_COMMON_PREFIX}/set_modal_crypto_currency`,
    (payload: CryptoId) => ({
        payload,
    }),
);

const setModalAccountKey = createAction(
    `${TRADING_COMMON_PREFIX}/set_modal_account_key`,
    (payload: string) => ({ payload }),
);

const setTradingActiveSection = createAction(
    `${TRADING_COMMON_PREFIX}/set_trading_active_section`,
    (payload: TradingType) => ({ payload }),
);

const setTradingFromPrefilledCryptoId = createAction(
    `${TRADING_COMMON_PREFIX}/set_trading_from_prefilled_crypto_id`,
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
