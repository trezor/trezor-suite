import { CryptoId, InfoResponse } from 'invity-api';

import { extraDependenciesMock } from '@suite-common/test-utils';

import { TradingComposedTransactionInfo, initialState, tradingActions } from '../tradingReducer';
import { accounts } from './account';
import { buyThunks, exchangeThunks } from '../../thunks';
import {
    TradingPaymentMethodListProps,
    TradingTransactionBuy,
    TradingTransactionExchange,
} from '../../types';

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
    selectedAccountKey: 'xxx',
    receiveAccountKey: 'yyy',
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
    sendAccountKey: 'xxx',
    receiveAccountKey: 'yyy',
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
        description: 'should set initial state',
        initialState,
        actions: [
            {
                type: 'none',
            },
        ],
        result: initialState,
    },
    {
        description: 'should call STORAGE.LOAD and set trades from the storage',
        initialState,
        actions: [
            {
                type: extraDependenciesMock.actionTypes.storageLoad,
                payload: {
                    tradingTrades: [tradeBuy],
                },
            },
        ],
        result: {
            ...initialState,
            trades: [tradeBuy],
        },
    },
    {
        description: 'should call STORAGE.LOAD and trades should stay stable',
        initialState: {
            ...initialState,
            trades: [tradeBuy],
        },
        actions: [
            {
                type: extraDependenciesMock.actionTypes.storageLoad,
                payload: {
                    tradingTrades: undefined,
                },
            },
        ],
        result: {
            ...initialState,
            trades: [tradeBuy],
        },
    },
    {
        description: 'should set modal account',
        initialState,
        actions: [
            {
                type: tradingActions.setModalAccountKey.type,
                payload: accounts[0].key,
            },
        ],
        result: {
            ...initialState,
            modalAccountKey: accounts[0].key,
        },
    },
    {
        description: 'should clear modal account',
        initialState: {
            ...initialState,
            modalAccountKey: accounts[0].key,
        },
        actions: [
            {
                type: tradingActions.setModalAccountKey.type,
                payload: undefined,
            },
        ],
        result: {
            ...initialState,
            modalAccountKey: undefined,
        },
    },
    {
        description: 'should set crypto currency for modal',
        initialState,
        actions: [
            {
                type: tradingActions.setModalCryptoCurrency.type,
                payload: 'ankr' as CryptoId,
            },
        ],
        result: {
            ...initialState,
            modalCryptoId: 'ankr',
        },
    },
    {
        description: 'should clear crypto currency for modal',
        initialState: {
            ...initialState,
            modalCryptoId: 'ankr' as CryptoId,
        },
        actions: [
            {
                type: tradingActions.setModalCryptoCurrency.type,
                payload: undefined,
            },
        ],
        result: {
            ...initialState,
            modalCryptoId: undefined,
        },
    },
    {
        description: 'should set active section',
        initialState,
        actions: [
            {
                type: tradingActions.setTradingActiveSection.type,
                payload: 'exchange',
            },
        ],
        result: {
            ...initialState,
            activeSection: 'exchange',
        },
    },
    {
        description: 'should load symbols info',
        initialState,
        actions: [
            {
                type: tradingActions.saveInfo.type,
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
        description: 'should set prefilled account',
        initialState,
        actions: [
            {
                type: tradingActions.setTradingFromPrefilledAccount.type,
                payload: {
                    cryptoId: 'ankr' as CryptoId,
                    descriptor: 'abc',
                },
            },
        ],
        result: {
            ...initialState,
            prefilledFromAccount: {
                cryptoId: 'ankr',
                descriptor: 'abc',
            },
        },
    },
    {
        description: 'should save trade for buy and exchange',
        initialState,
        actions: [
            {
                type: tradingActions.saveTrade.type,
                payload: tradeBuy,
            },
            {
                type: tradingActions.saveTrade.type,
                payload: tradeExchange,
            },
            {
                type: tradingActions.saveTrade.type,
                payload: {
                    ...tradeBuy,
                    key: undefined,
                },
            },
        ],
        result: {
            ...initialState,
            trades: [tradeBuy, tradeExchange],
        },
    },
    {
        description: 'should save payment methods',
        initialState,
        actions: [
            {
                type: tradingActions.savePaymentMethods.type,
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
        description: 'should save composed transaction info',
        initialState,
        actions: [
            {
                type: tradingActions.saveComposedTransactionInfo.type,
                payload: composedTransactionInfo,
            },
        ],
        result: {
            ...initialState,
            composedTransactionInfo,
        },
    },
    {
        description: 'should set loading status',
        initialState,
        actions: [
            {
                type: tradingActions.setLoading.type,
                payload: loadingStatus,
            },
        ],
        result: {
            ...initialState,
            ...loadingStatus,
        },
    },
    {
        description: 'should set loading for buy section, when handleRequestThunk is triggered',
        initialState,
        actions: [
            {
                type: buyThunks.handleRequestThunk.pending.type,
            },
        ],
        result: {
            ...initialState,
            buy: {
                ...initialState.buy,
                isLoading: true,
            },
        },
    },
    {
        description: 'should set off loading for buy section, when handleRequestThunk is completed',
        initialState,
        actions: [
            {
                type: buyThunks.handleRequestThunk.fulfilled.type,
            },
        ],
        result: {
            ...initialState,
            buy: {
                ...initialState.buy,
                isLoading: false,
            },
        },
    },
    {
        description: 'should set loading for exchange section, when confirmTradeThunk is triggered',
        initialState,
        actions: [
            {
                type: exchangeThunks.confirmTradeThunk.pending.type,
            },
        ],
        result: {
            ...initialState,
            exchange: {
                ...initialState.exchange,
                isLoading: true,
            },
        },
    },
    {
        description:
            'should set off loading for exchange section, when confirmTradeThunk is completed',
        initialState,
        actions: [
            {
                type: exchangeThunks.confirmTradeThunk.fulfilled.type,
            },
        ],
        result: {
            ...initialState,
            exchange: {
                ...initialState.exchange,
                isLoading: false,
            },
        },
    },
];
