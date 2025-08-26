import { SellFiatTrade } from 'invity-api';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { getBtcAccount } from '../../__fixtures__/account';
import { sellQuotes } from '../../__fixtures__/sellQuotes';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellBestQuotesForAvailablePaymentMethods,
    selectSellFormDefaultValues,
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

    describe('selectSellSelectedSendAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.tradingNew.sell.tradingAccountKey = account.key;
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.tradingNew.sell.tradingAccountKey = undefined;

            expect(selectSellSelectedSendAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            expect(selectSellSelectedSendAccount(state)).toEqual(account);
        });

        it('should be stable', () => {
            expect(selectSellSelectedSendAccount(state)).toBe(selectSellSelectedSendAccount(state));
        });

        it('should return undefined when no account with given key exists', () => {
            state.wallet.tradingNew.sell.tradingAccountKey = 'unknown_account_key';

            expect(selectSellSelectedSendAccount(state)).toBeUndefined();
        });
    });

    describe('selectSellBestQuotesForAvailablePaymentMethods', () => {
        beforeEach(() => {
            state.wallet.tradingNew.sell.quotes = sellQuotes;
        });

        it('should return only best quote for each payment method', () => {
            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([
                expect.objectContaining({
                    paymentMethod: 'creditCard',
                    rate: 3940,
                }),
                expect.objectContaining({
                    paymentMethod: 'bankTransfer',
                    rate: 3937.6279729091198,
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
                ...sellQuotes[0],
                paymentMethod: undefined,
            } as unknown as SellFiatTrade;

            state.wallet.tradingNew.sell.quotes = [quote];

            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });

        it('should ignore quotes without payment method name', () => {
            const quote = {
                ...sellQuotes[0],
                paymentMethodName: undefined,
            } as unknown as SellFiatTrade;

            state.wallet.tradingNew.sell.quotes = [quote];

            expect(selectSellBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });
    });
});
