import type { SellFiatTrade } from 'invity-api';

import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    banxaCreditCardSellQuote,
    getBtcAccount,
    getWalletState,
    sellQuotes,
} from '@suite-native/trading-fixtures';

import { type TradingRootState } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellBestQuotesForAvailablePaymentMethods,
    selectSellFormDefaultValues,
    selectSellQuotesByPaymentMethod,
    selectSellSelectedSendAccount,
    selectSellSupportedFiatCurrencies,
    selectSellSupportedFiatCurrenciesList,
    selectTradingSell,
} from '../sellSelectors';

describe('sellSelectors', () => {
    let state: TradingRootState & AccountsRootState;

    beforeEach(() => {
        state = { wallet: getWalletState({ tradeType: 'sell' }) };
    });

    it('selectTradingSell should select trading sell state', () => {
        expect(selectTradingSell(state)).toEqual(state.wallet.trading.sell);
    });

    describe('selectSellSupportedFiatCurrencies', () => {
        it('should select supportedFiatCurrencies', () => {
            // Mock the sell info with supported currencies
            state.wallet.trading.sell.sellInfo = {
                supportedFiatCurrencies: ['usd', 'eur', 'czk'],
                supportedCryptoCurrencies: [],
                providerInfos: {},
                country: 'CZ',
            };

            expect(selectSellSupportedFiatCurrencies(state)).toEqual(['usd', 'eur', 'czk']);
        });

        it('should return stable empty array when supportedFiatCurrencies are not set', () => {
            state.wallet.trading.sell.sellInfo = undefined;

            const result = selectSellSupportedFiatCurrencies(state);
            expect(result).toEqual([]);
            expect(selectSellSupportedFiatCurrencies(state)).toEqual(result);
        });

        it('should return stable empty array when sellInfo is not set', () => {
            state.wallet.trading.sell.sellInfo = undefined;

            const result = selectSellSupportedFiatCurrencies(state);
            expect(result).toEqual([]);
            expect(selectSellSupportedFiatCurrencies(state)).toEqual(result);
        });
    });

    describe('selectSellSupportedFiatCurrenciesList', () => {
        beforeEach(() => {
            state.wallet.trading.sell.sellInfo = {
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
            state.wallet.trading.sell.sellInfo!.supportedFiatCurrencies = ['unknown', 'usd'];

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
            state.wallet.trading.sell.amountLimits = {
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
            state.wallet.trading.sell.amountLimits = undefined;

            expect(selectSellAmountLimits(state)).toBeUndefined();
        });
    });

    describe('selectSellFormDefaultValues', () => {
        beforeEach(() => {
            // Mock the trading sell info
            state.wallet.trading.sell.sellInfo = {
                supportedFiatCurrencies: ['usd', 'eur'],
                supportedCryptoCurrencies: [],
                providerInfos: {},
                country: 'CZ',
            };

            // Mock the coins info
            state.wallet.trading.info.coins = {
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
                country: expect.objectContaining({
                    value: 'CZ',
                }),
                amountInCrypto: false,
            });
        });

        it('should respect residence settings', () => {
            state.wallet.trading.residence.country = 'DE';

            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'DE',
                    }),
                }),
            );
        });

        it('should return empty object when sell info is not initialized', () => {
            state.wallet.trading.sell.sellInfo = undefined;

            expect(selectSellFormDefaultValues(state)).toEqual({});
        });

        it('should return empty object when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectSellFormDefaultValues(state)).toEqual({});
        });

        it('should not specify country if country is not in the list', () => {
            state.wallet.trading.sell.sellInfo!.country = 'XX';

            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'unknown',
                    }),
                }),
            );
        });

        it('should not specify country if country is sanctioned', () => {
            state.wallet.trading.sell.sellInfo!.country = 'KP';

            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'unknown',
                    }),
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

        it('should restore persisted subdivision when valid for the selected country', () => {
            state.wallet.trading.residence.country = 'US';
            state.wallet.trading.residence.countrySubdivision = 'CA';

            expect(selectSellFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({ value: 'US' }),
                    countrySubdivision: expect.objectContaining({
                        value: 'CA',
                        name: 'California',
                    }),
                }),
            );
        });

        it('should ignore stale persisted subdivision when country does not require one', () => {
            state.wallet.trading.residence.country = 'DE';
            state.wallet.trading.residence.countrySubdivision = 'CA';

            expect(selectSellFormDefaultValues(state).countrySubdivision).toBeUndefined();
        });
    });

    describe('selectSellSelectedSendAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.trading.sell.tradingAccountKey = account.key;
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.trading.sell.tradingAccountKey = undefined;

            expect(selectSellSelectedSendAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            expect(selectSellSelectedSendAccount(state)).toEqual(account);
        });

        it('should be stable', () => {
            expect(selectSellSelectedSendAccount(state)).toBe(selectSellSelectedSendAccount(state));
        });

        it('should return undefined when no account with given key exists', () => {
            state.wallet.trading.sell.tradingAccountKey = 'unknown_account_key' as AccountKey; // Todo: create properly via `createAccountKey()`

            expect(selectSellSelectedSendAccount(state)).toBeUndefined();
        });
    });

    describe('selectSellBestQuotesForAvailablePaymentMethods', () => {
        beforeEach(() => {
            state.wallet.trading.sell.quotes = sellQuotes;
        });

        it('should return only first quote for each payment method', () => {
            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([
                expect.objectContaining({
                    paymentMethod: 'bankTransfer',
                    rate: 3937.6279729091198,
                }),
                expect.objectContaining({
                    paymentMethod: 'creditCard',
                    rate: 3869.9570815450643,
                }),
            ]);
        });

        it('should be stable', () => {
            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toBe(
                selectSellBestQuotesForAvailablePaymentMethods(state),
            );
        });

        it('should ignore quotes without payment method', () => {
            const quote = {
                ...banxaCreditCardSellQuote,
                paymentMethod: undefined,
            } as unknown as SellFiatTrade;

            state.wallet.trading.sell.quotes = [quote];

            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });

        it('should ignore quotes without payment method name', () => {
            const quote = {
                ...banxaCreditCardSellQuote,
                paymentMethodName: undefined,
            } as unknown as SellFiatTrade;

            state.wallet.trading.sell.quotes = [quote];

            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });

        it('should sort quotes by rates', () => {
            const quote1 = {
                ...banxaCreditCardSellQuote,
                paymentMethod: 'creditCard',
                rate: 10000,
            } as SellFiatTrade;
            const quote2 = {
                ...banxaCreditCardSellQuote,
                paymentMethod: 'bankTransfer',
                rate: 20000,
            } as SellFiatTrade;
            state.wallet.trading.sell.quotes = [quote1, quote2];

            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([quote2, quote1]);
        });
    });

    describe('selectSellQuotesByPaymentMethod', () => {
        beforeEach(() => {
            state.wallet.trading.sell.quotes = sellQuotes;
        });

        it('should select valid quotes', () => {
            expect(selectSellQuotesByPaymentMethod(state, 'creditCard')).toEqual({
                fixed: [
                    expect.objectContaining({ orderId: 'order_id_0' }),
                    expect.objectContaining({ orderId: 'order_id_2' }),
                ],
            });
        });

        it('should be stable', () => {
            expect(selectSellQuotesByPaymentMethod(state, 'creditCard')).toBe(
                selectSellQuotesByPaymentMethod(state, 'creditCard'),
            );
        });
    });
});
