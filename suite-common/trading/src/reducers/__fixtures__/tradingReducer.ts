import { CryptoId, InfoResponse } from 'invity-api';

import * as TRADING_ACTIONS from '../../actions/tradingActions';
import { TradingComposedTransactionInfo, TradingState } from '../tradingReducer';
import { accounts } from './account';
import { buyInitialState } from './buyTradingReducer';
import {
    TradingPaymentMethodListProps,
    TradingTransactionBuy,
    TradingTransactionExchange,
} from '../../types';

const initialState: TradingState = {
    info: {
        platforms: undefined,
        coins: undefined,
        paymentMethods: [],
    },
    buy: buyInitialState,
    // TODO: sell:
    // TODO: exchange:
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalAccountKey: undefined,
    modalCryptoId: undefined,
    lastLoadedTimestamp: 0,
    activeSection: 'buy',
    prefilledFromCryptoId: undefined,
};

const tradeBuy: TradingTransactionBuy = {
    date: 'ddd',
    key: 'buy-key',
    tradeType: 'buy',
    data: {
        fiatStringAmount: '47.12',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.004705020432603938',
        rate: 10014.834297738,
        quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
        exchange: 'mercuryo',
        minFiat: 20.03,
        maxFiat: 2000.05,
        minCrypto: 0.002,
        maxCrypto: 0.19952,
        paymentMethod: 'creditCard',
    },
    account: {
        symbol: 'btc',
        descriptor: 'asdfasdfasdfasdfas',
        accountIndex: 0,
        accountType: 'normal',
    },
};

const tradeExchange: TradingTransactionExchange = {
    date: 'ddd',
    key: 'exchange-key',
    tradeType: 'exchange',
    data: {
        sendStringAmount: '47.12',
        send: 'LTC' as CryptoId,
        receive: 'BTC' as CryptoId,
        receiveStringAmount: '0.004705020432603938',
        orderId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
        exchange: 'changelly',
        status: 'CONFIRMING',
    },
    account: {
        symbol: 'btc',
        descriptor: 'asdfasdfasdfasdfas',
        accountIndex: 0,
        accountType: 'normal',
    },
};

const symbolsInfo: InfoResponse = {
    platforms: {
        ethereum: {
            id: 'ethereum',
            name: 'Ethereum',
            nativeCoinSymbol: 'eth',
        },
    },
    coins: {
        ethereum: {
            coingeckoId: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            services: {
                buy: true,
                sell: true,
                exchange: true,
            },
        },
    },
};

const paymentMethods: TradingPaymentMethodListProps[] = [
    {
        value: '',
        label: '',
    },
    {
        value: 'creditCard',
        label: 'Credit Card',
    },
];

const composedTransactionInfo: TradingComposedTransactionInfo = {
    selectedFee: 'normal',
    composed: {
        feePerByte: '10',
        feeLimit: '100',
        fee: '1000',
    },
};

const loadingStatus = {
    isLoading: true,
    lastLoadedTimestamp: 1,
};

export const tradingFixtures = [
    {
        description: 'test initial state',
        initialState,
        actions: [
            {
                type: 'none',
            },
        ],
        result: initialState,
    },
    {
        description: 'test STORAGE.LOAD',
        initialState,
        actions: [
            {
                type: 'STORAGE.LOAD',
                payload: {
                    tradingTrades: initialState.trades,
                },
            },
        ],
        result: initialState,
    },
    {
        description: 'test setting modal account',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_MODAL_ACCOUNT_KEY,
                payload: accounts[0].key,
            },
        ],
        result: {
            ...initialState,
            modalAccountKey: accounts[0].key,
        },
    },
    {
        description: 'test clearing modal account',
        initialState: {
            ...initialState,
            modalAccountKey: accounts[0].key,
        },
        actions: [
            {
                type: TRADING_ACTIONS.SET_MODAL_ACCOUNT_KEY,
                payload: undefined,
            },
        ],
        result: {
            ...initialState,
            modalAccountKey: undefined,
        },
    },
    {
        description: 'test setting crypto currency for modal',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_MODAL_CRYPTO_CURRENCY,
                payload: 'ankr' as CryptoId,
            },
        ],
        result: {
            ...initialState,
            modalCryptoId: 'ankr',
        },
    },
    {
        description: 'test clearing crypto currency for modal',
        initialState: {
            ...initialState,
            modalCryptoId: 'ankr' as CryptoId,
        },
        actions: [
            {
                type: TRADING_ACTIONS.SET_MODAL_CRYPTO_CURRENCY,
                payload: undefined,
            },
        ],
        result: {
            ...initialState,
            modalCryptoId: undefined,
        },
    },
    {
        description: 'test setting active section',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_TRADING_ACTIVE_SECTION,
                payload: 'exchange',
            },
        ],
        result: {
            ...initialState,
            activeSection: 'exchange',
        },
    },
    {
        description: 'test loading symbols info',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SAVE_SYMBOLS_INFO,
                payload: symbolsInfo,
            },
        ],
        result: {
            ...initialState,
            info: {
                platforms: symbolsInfo.platforms,
                coins: symbolsInfo.coins,
                paymentMethods: [],
            },
        },
    },
    {
        description: 'test setting prefilled crypto id',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_TRADING_FROM_PREFILLED_CRYPTO_ID,
                payload: 'ankr' as CryptoId,
            },
        ],
        result: {
            ...initialState,
            prefilledFromCryptoId: 'ankr',
        },
    },
    {
        description: 'test setting prefilled crypto id',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_TRADING_FROM_PREFILLED_CRYPTO_ID,
                payload: 'ankr' as CryptoId,
            },
        ],
        result: {
            ...initialState,
            prefilledFromCryptoId: 'ankr',
        },
    },
    {
        description: 'test saving trade for buy and exchange',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SAVE_TRADE,
                payload: tradeBuy,
            },
            {
                type: TRADING_ACTIONS.SAVE_TRADE,
                payload: tradeExchange,
            },
        ],
        result: {
            ...initialState,
            trades: [tradeBuy, tradeExchange],
        },
    },
    {
        description: 'test saving payment methods',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SAVE_PAYMENT_METHODS,
                payload: paymentMethods,
            },
        ],
        result: {
            ...initialState,
            info: {
                ...initialState.info,
                paymentMethods,
            },
        },
    },
    {
        description: 'test saving composed transaction info',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SAVE_COMPOSED_TRANSACTION_INFO,
                payload: composedTransactionInfo,
            },
        ],
        result: {
            ...initialState,
            composedTransactionInfo,
        },
    },
    {
        description: 'test setting loading status',
        initialState,
        actions: [
            {
                type: TRADING_ACTIONS.SET_LOADING,
                payload: loadingStatus,
            },
        ],
        result: {
            ...initialState,
            ...loadingStatus,
        },
    },
];
