import { AccountsRootState } from '@suite-common/wallet-core';

import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellFormDefaultValues,
    selectSellSupportedFiatCurrencies,
    selectSellSupportedFiatCurrenciesList,
    selectTradingSell,
} from '../sellSelectors';

describe('sellSelectors', () => {
    let state: TradingRootState & AccountsRootState;

    beforeEach(() => {
        state = { wallet: getWalletState() };
    });

    it('selectTradingSell should select trading sell state', () => {
        expect(selectTradingSell(state)).toEqual(state.wallet.tradingNew.sell);
    });

    describe('selectSellSupportedFiatCurrencies', () => {
        it('should select supportedFiatCurrencies', () => {
            // Mock the sell info with supported currencies
            state.wallet.tradingNew.sell.sellInfo = {
                supportedFiatCurrencies: ['usd', 'eur', 'czk'],
                supportedCryptoCurrencies: [],
                providerInfos: {},
                country: 'CZ',
            };

            expect(selectSellSupportedFiatCurrencies(state)).toEqual(['usd', 'eur', 'czk']);
        });

        it('should return stable empty array when supportedFiatCurrencies are not set', () => {
            state.wallet.tradingNew.sell.sellInfo = undefined;

            const result = selectSellSupportedFiatCurrencies(state);
            expect(result).toEqual([]);
            expect(selectSellSupportedFiatCurrencies(state)).toEqual(result);
        });

        it('should return stable empty array when sellInfo is not set', () => {
            state.wallet.tradingNew.sell.sellInfo = undefined;

            const result = selectSellSupportedFiatCurrencies(state);
            expect(result).toEqual([]);
            expect(selectSellSupportedFiatCurrencies(state)).toEqual(result);
        });
    });

    describe('selectSellSupportedFiatCurrenciesList', () => {
        beforeEach(() => {
            state.wallet.tradingNew.sell.sellInfo = {
                supportedFiatCurrencies: ['usd', 'eur', 'czk'],
                supportedCryptoCurrencies: [],
                providerInfos: {},
                country: 'CZ',
            };
        });

        it('should return supportedFiatCurrencies with proper formatting', () => {
            expect(selectSellSupportedFiatCurrenciesList(state)).toEqual([
                {
                    displayValue: 'USD',
                    label: 'United States Dollar',
                    value: 'usd',
                },
                {
                    displayValue: 'EUR',
                    label: 'Euro',
                    value: 'eur',
                },
                {
                    displayValue: 'CZK',
                    label: 'Czech Koruna',
                    value: 'czk',
                },
            ]);
        });

        it('should be stable', () => {
            expect(selectSellSupportedFiatCurrenciesList(state)).toBe(
                selectSellSupportedFiatCurrenciesList(state),
            );
        });

        it('should handle unknown currency codes', () => {
            state.wallet.tradingNew.sell.sellInfo!.supportedFiatCurrencies = ['unknown', 'usd'];

            expect(selectSellSupportedFiatCurrenciesList(state)).toEqual([
                {
                    displayValue: 'UNKNOWN',
                    label: 'UNKNOWN',
                    value: 'unknown',
                },
                {
                    displayValue: 'USD',
                    label: 'United States Dollar',
                    value: 'usd',
                },
            ]);
        });
    });

    describe('selectSellAmountLimits', () => {
        it('should return amount limits', () => {
            state.wallet.tradingNew.sell.amountLimits = {
                currency: 'BTC',
                maxCrypto: '50',
                minCrypto: '0.0001',
            };

            expect(selectSellAmountLimits(state)).toEqual({
                currency: 'BTC',
                maxCrypto: '50',
                minCrypto: '0.0001',
            });
        });

        it('should return undefined when amount limits are not set', () => {
            state.wallet.tradingNew.sell.amountLimits = undefined;

            expect(selectSellAmountLimits(state)).toBeUndefined();
        });
    });

    describe('selectSellFormDefaultValues', () => {
        beforeEach(() => {
            // Mock the trading sell info
            state.wallet.tradingNew.sell.sellInfo = {
                supportedFiatCurrencies: ['usd', 'eur'],
                supportedCryptoCurrencies: [],
                providerInfos: {},
                country: 'CZ',
            };

            // Mock the coins info
            state.wallet.tradingNew.info.coins = {
                bitcoin: {
                    symbol: 'btc',
                    name: 'Bitcoin',
                    coingeckoId: 'bitcoin',
                    services: {
                        buy: true,
                        sell: true,
                        exchange: true,
                    },
                },
            };
        });

        it('should return object with computed default values', () => {
            expect(selectSellFormDefaultValues(state)).toEqual({
                fiatCurrency: 'usd',
                country: {
                    label: '🇨🇿 Czech Republic',
                    value: 'CZ',
                },
                amountInCrypto: false,
            });
        });

        it('should return empty object when sell info is not initialized', () => {
            state.wallet.tradingNew.sell.sellInfo = undefined;

            expect(selectSellFormDefaultValues(state)).toEqual({});
        });

        it('should return empty object when coins are not set', () => {
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectSellFormDefaultValues(state)).toEqual({});
        });

        it('should not specify country if country is not in the list', () => {
            state.wallet.tradingNew.sell.sellInfo!.country = 'XX';

            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: undefined,
                }),
            );
        });

        it('should use USD as default fiat currency', () => {
            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    fiatCurrency: 'usd',
                }),
            );
        });

        it('should set amountInCrypto to false by default', () => {
            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    amountInCrypto: false,
                }),
            );
        });

        it('should be stable', () => {
            expect(selectSellFormDefaultValues(state)).toBe(selectSellFormDefaultValues(state));
        });
    });
});
