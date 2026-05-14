import type { Coins, CryptoId, FiatCurrenciesProps, FiatCurrencyCode, Platforms } from 'invity-api';

import {
    type TradingBuyState,
    type TradingExchangeState,
    type TradingPaymentMethodListProps,
    type TradingSellState,
    type TradingType,
} from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';
import { type TradingState } from '@suite-native/trading-types';

import { buyCexdirect, buyInvity, buyMercuryo } from './buyProviders';
import { buyQuotes } from './buyQuotes';
import { coins } from './coins';
import { exchangeCexdirect, exchangeInvity, exchangeMercuryo } from './exchangeProviders';
import { exchangeQuotes } from './exchangeQuotes';
import { platforms } from './platforms';
import { sellBanxa, sellCexdirect, sellInvity, sellMercuryo, sellMoonpay } from './sellProviders';
import { sellQuotes } from './sellQuotes';

export const getInitializedBuyState = () =>
    ({
        ...tradingInitialState.buy,
        quotesRequest: undefined,
        selectedQuote: {
            paymentMethod: 'eps',
        },
        buyInfo: {
            buyInfo: {
                country: 'CZ',
                providers: [buyInvity, buyMercuryo, buyCexdirect],
                defaultAmountsOfFiatCurrencies: {
                    usd: 150,
                    eur: 100,
                    czk: 2500,
                } as FiatCurrenciesProps,
                suggestedFiatCurrency: 'CZK',
            },
            supportedCryptoCurrencies: [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
                'eos',
                'ethereum',
                'bitcoin',
            ] as CryptoId[],
            providerInfos: {
                ['invity']: buyInvity,
                ['mercuryo']: buyMercuryo,
                ['cexdirect']: buyCexdirect,
            },
            supportedFiatCurrencies: ['usd', 'eur', 'czk'],
        },
        amountLimits: {
            currency: 'BTC',
            minCrypto: '0.0001',
            maxCrypto: '50',
        },
    }) as TradingBuyState;

export const getInitializedExchangeState = () =>
    ({
        ...tradingInitialState.exchange,
        exchangeInfo: {
            providerInfos: {
                ['invity']: exchangeInvity,
                ['mercuryo']: exchangeMercuryo,
                ['cexdirect']: exchangeCexdirect,
            },
            buyCryptoIds: [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'ethereum',
                'bitcoin',
            ] as CryptoId[],
            sellCryptoIds: [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'ethereum--0xWithoutObjectInCoinsInfo',
                'eos',
                'ethereum',
                'bitcoin',
            ] as CryptoId[],
        },
        amountLimits: {
            currency: 'BTC',
            minCrypto: '0.0001',
            maxCrypto: '50',
        },
    }) as TradingExchangeState;

export const getInitializedSellState = () =>
    ({
        ...tradingInitialState.sell,
        sellInfo: {
            providerInfos: {
                ['invity']: sellInvity,
                ['mercuryo']: sellMercuryo,
                ['cexdirect']: sellCexdirect,
                ['banxa-sell']: sellBanxa,
                ['moonpay-sell']: sellMoonpay,
            },
            supportedFiatCurrencies: ['usd', 'eur', 'pln'] as FiatCurrencyCode[],
            supportedCryptoCurrencies: [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'ethereum',
                'bitcoin',
            ] as CryptoId[],
            country: 'CZ',
        },
        amountLimits: {
            currency: 'BTC',
            minCrypto: '0.0001',
            maxCrypto: '50',
        },
    }) as TradingSellState;

export const getInitializedTradingState = (tradeType: TradingType = 'buy') =>
    ({
        ...tradingInitialState,
        buy: getInitializedBuyState(),
        exchange: getInitializedExchangeState(),
        sell: getInitializedSellState(),
        info: {
            paymentMethods: [
                {
                    value: 'creditCard',
                    label: 'Credit Card label',
                },
            ] as TradingPaymentMethodListProps[],
            coins: coins as Coins,
            platforms: platforms as Platforms,
        },
        trades: [{ tradeType, data: { orderId: 'trade-order-id-1' } }],
        activeTradingType: tradeType,
        residence: {
            country: undefined,
            wasOnboardingVisited: false,
        },
    }) as TradingState;

export const getInitializedTradingStateWithQuotes = () => {
    const state = getInitializedTradingState();

    state.buy.quotes = buyQuotes as TradingBuyState['quotes'];
    state.exchange.quotes = exchangeQuotes;
    state.sell.quotes = sellQuotes;

    state.info.paymentMethods = [
        {
            value: 'creditCard',
            label: 'Credit Card',
        },
        {
            value: 'applePay',
            label: 'Apple Pay',
        },
    ];

    return state;
};
