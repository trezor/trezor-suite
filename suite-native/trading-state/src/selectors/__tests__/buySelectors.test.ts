import { Platform } from 'react-native';

import type { BuyTrade } from 'invity-api';

import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { FeatureFlag, type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { buyQuotes, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';

import { type TradingRootState } from '../../reducers';
import {
    selectBuyAmountLimits,
    selectBuyBestQuotesForAvailablePaymentMethods,
    selectBuyFormDefaultValues,
    selectBuyQuotesByPaymentMethodNative,
    selectBuySelectedReceiveAccount,
    selectBuySupportedFiatCurrencies,
    selectBuySupportedFiatCurrenciesList,
    selectBuyTradeableAssets,
    selectTradingBuy,
    selectValidTradingBuyQuotesNative,
} from '../buySelectors';

describe('buySelectors', () => {
    let state: TradingRootState & AccountsRootState & FeatureFlagsRootState;

    beforeEach(() => {
        Platform.OS = 'ios';
        jest.spyOn(Platform, 'select').mockImplementation(
            (specifics: any) => specifics.ios ?? specifics.default,
        );
        state = {
            wallet: getWalletState(),
            featureFlags: {
                [FeatureFlag.AreDebugOnlyNetworksEnabled]: false,
                [FeatureFlag.AreExperimentalOnlyNetworksEnabled]: false,
            } as FeatureFlagsRootState['featureFlags'],
        };
    });

    it('selectTradingBuy should select trading buy state', () => {
        expect(selectTradingBuy(state)).toEqual(state.wallet.trading.buy);
    });

    describe('selectBuySelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.trading.buy.tradingAccountKey = account.key;
            state.wallet.trading.buy.receiveAddress = account.addresses?.used[0].address;
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.trading.buy.tradingAccountKey = undefined;

            expect(selectBuySelectedReceiveAccount(state)).toBeUndefined();
        });

        it('should select receiveAccount and receiveAddress', () => {
            expect(selectBuySelectedReceiveAccount(state)).toEqual({
                account,
                address: account.addresses?.used[0],
            });
        });

        it('should be stable', () => {
            expect(selectBuySelectedReceiveAccount(state)).toBe(
                selectBuySelectedReceiveAccount(state),
            );
        });

        it('should throw when no account with given key exists', () => {
            state.wallet.trading.buy.tradingAccountKey = 'unknown_account_key' as AccountKey; // Todo: create properly via `createAccountKey()`

            expect(() => selectBuySelectedReceiveAccount(state)).toThrow(
                'Unknown tradingAccountKey: [unknown_account_key]',
            );
        });
    });

    describe('selectBuyTradeableAssets', () => {
        it('should select only coins with buy set to true', () => {
            expect(selectBuyTradeableAssets(state)).toEqual([
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({ cryptoId: 'bitcoin' }),
            ]);
        });

        it('should be stable', () => {
            const first = selectBuyTradeableAssets(state);
            const second = selectBuyTradeableAssets(state);

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectBuyTradeableAssets(state)).toEqual([]);
        });

        describe.skip('debug-only networks', () => {
            // There are currently no debug only networks. Skipping
        });
    });

    describe('selectBuyFormDefaultValues', () => {
        it('should return object with empty values when buy info is not initialized ', () => {
            state.wallet.trading.buy.buyInfo = undefined;

            expect(selectBuyFormDefaultValues(state)).toEqual({});
        });

        it('should return object with computed default values', () => {
            expect(selectBuyFormDefaultValues(state)).toEqual({
                fiatCurrency: 'czk',
                country: expect.objectContaining({
                    value: 'CZ',
                }),
                amountInCrypto: false,
            });
        });

        it('should respect residence settings', () => {
            state.wallet.trading.residence.country = 'DE';

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'DE',
                    }),
                }),
            );
        });

        it('should use default value for fiat currency if no fiat is suggested', () => {
            state.wallet.trading.buy.buyInfo!.buyInfo.suggestedFiatCurrency = undefined;

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    fiatCurrency: 'usd',
                }),
            );
        });

        it('should not specify country if country is not in the list', () => {
            state.wallet.trading.buy.buyInfo!.buyInfo.country = 'XX';

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'unknown',
                    }),
                }),
            );
        });

        it('should not specify country if country is sanctioned', () => {
            state.wallet.trading.buy.buyInfo!.buyInfo.country = 'KP';

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: expect.objectContaining({
                        value: 'unknown',
                    }),
                }),
            );
        });
    });

    describe('selectBuySupportedFiatCurrencies', () => {
        it('should select supportedFiatCurrencies', () => {
            expect(selectBuySupportedFiatCurrencies(state)).toEqual(['usd', 'eur', 'czk']);
        });

        it('should return stable empty array when supportedFiatCurrencies are not set', () => {
            state.wallet.trading.buy.buyInfo = undefined;

            const result = selectBuySupportedFiatCurrencies(state);
            expect(result).toEqual([]);
            expect(selectBuySupportedFiatCurrencies(state)).toEqual(result);
        });
    });

    describe('selectBuySupportedFiatCurrenciesList', () => {
        it('should return supportedFiatCurrencies', () => {
            expect(selectBuySupportedFiatCurrenciesList(state)).toEqual([
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
            expect(selectBuySupportedFiatCurrenciesList(state)).toBe(
                selectBuySupportedFiatCurrenciesList(state),
            );
        });

        it('should deduplicate values', () => {
            state.wallet.trading.buy.buyInfo!.supportedFiatCurrencies = [
                'usd',
                'usd',
                'eur',
                'czk',
                'eur',
            ];

            expect(selectBuySupportedFiatCurrenciesList(state)).toEqual([
                expect.objectContaining({ value: 'usd' }),
                expect.objectContaining({ value: 'eur' }),
                expect.objectContaining({ value: 'czk' }),
            ]);
        });
    });

    describe('selectBuyAmountLimits', () => {
        it('should return amount limits', () => {
            expect(selectBuyAmountLimits(state)).toEqual({
                currency: 'BTC',
                maxCrypto: '50',
                minCrypto: '0.0001',
            });
        });
    });

    describe('selectValidMobileTradingBuyQuotes', () => {
        beforeEach(() => {
            state.wallet.trading.buy.quotes = [
                ...buyQuotes,
                { ...buyQuotes[0], exchange: 'simplex', orderId: 'order_id_4' },
            ] as BuyTrade[];
        });

        it('should return valid quotes', () => {
            expect(selectValidTradingBuyQuotesNative(state)).toEqual([
                expect.objectContaining({ orderId: 'order_id_0' }),
                expect.objectContaining({ orderId: 'order_id_1' }),
                expect.objectContaining({ orderId: 'order_id_3' }),
                expect.objectContaining({ orderId: 'order_id_4' }),
            ]);
        });

        it('should be stable', () => {
            expect(selectValidTradingBuyQuotesNative(state)).toBe(
                selectValidTradingBuyQuotesNative(state),
            );
        });

        describe('on android device', () => {
            it('should ignore applePay', () => {
                Platform.OS = 'android';
                (Platform.select as jest.Mock).mockImplementation(
                    specifics => specifics.android ?? specifics.default,
                );

                expect(selectValidTradingBuyQuotesNative(state)).toEqual([
                    expect.objectContaining({ orderId: 'order_id_1' }),
                    expect.objectContaining({ orderId: 'order_id_3' }),
                    expect.objectContaining({ orderId: 'order_id_4' }),
                ]);
            });
        });
    });

    describe('selectBuyBestQuotesForAvailablePaymentMethods', () => {
        beforeEach(() => {
            state.wallet.trading.buy.quotes = buyQuotes;
        });

        it('should return only first quote for each payment method', () => {
            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toEqual([
                expect.objectContaining({
                    paymentMethod: 'applePay',
                    rate: 9998.316675433,
                }),
                expect.objectContaining({
                    paymentMethod: 'creditCard',
                    rate: 20000,
                }),
                expect.objectContaining({
                    paymentMethod: 'googlePay',
                    rate: 9991.316675433,
                }),
            ]);
        });

        it('should be stable', () => {
            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toBe(
                selectBuyBestQuotesForAvailablePaymentMethods(state),
            );
        });

        it('should ignore quotes without payment method', () => {
            const quote = {
                ...buyQuotes[0],
                paymentMethod: undefined,
            } as unknown as BuyTrade;

            state.wallet.trading.buy.quotes = [quote];

            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });

        it('should ignore quotes without payment method name', () => {
            const quote = {
                ...buyQuotes[0],
                paymentMethodName: undefined,
            } as unknown as BuyTrade;

            state.wallet.trading.buy.quotes = [quote];

            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });
    });

    describe('selectMobileBuyQuotesByPaymentMethod', () => {
        beforeEach(() => {
            state.wallet.trading.buy.quotes = [
                ...buyQuotes,
                { ...buyQuotes[0], exchange: 'simplex', orderId: 'order_id_4' },
            ] as BuyTrade[];
        });

        it('should select valid quotes', () => {
            expect(selectBuyQuotesByPaymentMethodNative(state, 'creditCard')).toEqual({
                fixed: [
                    expect.objectContaining({ orderId: 'order_id_1' }),
                    expect.objectContaining({ orderId: 'order_id_3' }),
                ],
            });
        });

        it('should be stable', () => {
            expect(selectBuyQuotesByPaymentMethodNative(state, 'creditCard')).toBe(
                selectBuyQuotesByPaymentMethodNative(state, 'creditCard'),
            );
        });
    });
});
