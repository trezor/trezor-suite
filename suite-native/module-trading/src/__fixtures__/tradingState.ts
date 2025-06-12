import {
    BuyProviderInfo,
    Coins,
    CryptoId,
    ExchangeProviderInfo,
    FiatCurrenciesProps,
    Platforms,
} from 'invity-api';

import { TradingBuyState, TradingPaymentMethodListProps, TradingType } from '@suite-common/trading';

import { TradingState, initialState } from '../tradingSlice';
import coins from './coins.json';
import platforms from './platforms.json';
import { cexdirect, invity, mercuryo } from './providers';
import quotes from './quotes.json';

export const getInitializedBuyState = () =>
    ({
        ...initialState.buy,
        quotesRequest: undefined,
        selectedQuote: {
            paymentMethod: 'eps',
        },
        buyInfo: {
            buyInfo: {
                country: 'CZ',
                providers: [invity, mercuryo, cexdirect],
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
                ['invity']: invity,
                ['mercuryo']: mercuryo,
                ['cexdirect']: cexdirect,
            } as unknown as Record<string, BuyProviderInfo>,
            supportedFiatCurrencies: ['usd', 'eur', 'czk'],
        },
        amountLimits: {
            currency: 'BTC',
            minCrypto: '0.0001',
            maxCrypto: '50',
        },
    }) as TradingBuyState;

export const getInitializedExchangeState = () => ({
    ...initialState.exchange,
    exchangeInfo: {
        providerInfos: {
            ['invity']: invity,
            ['mercuryo']: mercuryo,
            ['cexdirect']: cexdirect,
        } as unknown as Record<string, ExchangeProviderInfo>,
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
});

export const getInitializedTradingState = (tradeType: TradingType = 'buy') =>
    ({
        ...initialState,
        buy: getInitializedBuyState(),
        exchange: getInitializedExchangeState(),
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
        trades: [{ tradeType }],
    }) as TradingState;

export const getInitializedTradingStateWithQuotes = () => {
    const state = getInitializedTradingState();

    state.buy.quotes = quotes as TradingBuyState['quotes'];
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
