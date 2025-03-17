import { BuyProviderInfo, Coins, CryptoId, FiatCurrenciesProps, Platforms } from 'invity-api';

import { TradingBuyState, TradingPaymentMethodListProps } from '@suite-common/trading';

import { TradingState, initialState } from '../tradingSlice';
import coins from './coins.json';
import invity from './invityProvider.json';
import platforms from './platforms.json';

export const getInitializedBuyState = () =>
    ({
        ...initialState.buy,
        quotesRequest: {
            wantCrypto: true,
            fiatCurrency: 'fiatCurrency',
            paymentMethod: 'eps',
            receiveCurrency: 'bitcoin' as CryptoId,
        },
        selectedQuote: {
            paymentMethod: 'eps',
        },
        buyInfo: {
            buyInfo: {
                country: 'CZ',
                providers: [invity] as BuyProviderInfo[],
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
            providerInfos: { ['invity']: invity } as unknown as Record<string, BuyProviderInfo>,
            supportedFiatCurrencies: ['usd', 'eur', 'czk'],
        },
    }) as TradingBuyState;

export const getInitializedTradingState = () =>
    ({
        ...initialState,
        buy: getInitializedBuyState(),
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
        trades: [{ tradeType: 'buy' }],
    }) as TradingState;
