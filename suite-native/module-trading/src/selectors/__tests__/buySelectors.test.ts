import { Platform } from 'react-native';

import { BuyTrade, CryptoId } from 'invity-api';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { getBtcAccount } from '../../__fixtures__/account';
import quotes from '../../__fixtures__/buyQuotes.json';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingRootState } from '../../reducers';
import {
    selectBuyAmountLimits,
    selectBuyBestQuotesForAvailablePaymentMethods,
    selectBuyFormDefaultValues,
    selectBuyQuotesByPaymentMethodNative,
    selectBuySelectedReceiveAccount,
    selectBuySupportedFiatCurrencies,
    selectBuySupportedFiatCurrenciesList,
    selectBuyTradeableAssetsSorted,
    selectTradingBuy,
    selectValidTradingBuyQuotesNative,
} from '../buySelectors';

jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
        select: jest.fn(specifics => specifics.ios ?? specifics.default),
    },
}));

describe('buySelectors', () => {
    let state: TradingRootState & AccountsRootState;

    beforeEach(() => {
        state = { wallet: getWalletState() };
    });

    it('selectTradingBuy should select trading buy state', () => {
        expect(selectTradingBuy(state)).toEqual(state.wallet.tradingNew.buy);
    });

    describe('selectBuySelectedReceiveAccount', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount();
            state.wallet.tradingNew.buy.tradingAccountKey = account.key;
            state.wallet.tradingNew.buy.receiveAddress = account.addresses?.used[0];
        });

        it('should be undefined when no tradingAccountKey is defined', () => {
            state.wallet.tradingNew.buy.tradingAccountKey = undefined;

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
            state.wallet.tradingNew.buy.tradingAccountKey = 'unknown_account_key';

            expect(() => selectBuySelectedReceiveAccount(state)).toThrow(
                'Unknown tradingAccountKey: [unknown_account_key]',
            );
        });
    });

    describe('selectBuyTradeableAssetsSorted', () => {
        it('should select only coins with buy set to true', () => {
            expect(selectBuyTradeableAssetsSorted(state)).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should sort coins', () => {
            state.wallet.tradingNew.buy.buyInfo!.supportedCryptoCurrencies = [
                'bitcoin',
                'ethereum',
                'eos',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ] as CryptoId[];

            expect(selectBuyTradeableAssetsSorted(state)).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });

        it('should be stable', () => {
            const first = selectBuyTradeableAssetsSorted(state);
            const second = selectBuyTradeableAssetsSorted(state);

            expect(first).toBe(second);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectBuyTradeableAssetsSorted(state)).toEqual([]);
        });
    });

    describe('selectBuyFormDefaultValues', () => {
        it('should return object with empty values when buy info is not initialized ', () => {
            state.wallet.tradingNew.buy.buyInfo = undefined;

            expect(selectBuyFormDefaultValues(state)).toEqual({});
        });

        it('should return object with computed default values', () => {
            expect(selectBuyFormDefaultValues(state)).toEqual({
                fiatCurrency: 'czk',
                country: {
                    label: '🇨🇿 Czech Republic',
                    value: 'CZ',
                },
                amountInCrypto: false,
            });
        });

        it('should use default value for fiat currency if no fiat is suggested', () => {
            state.wallet.tradingNew.buy.buyInfo!.buyInfo.suggestedFiatCurrency = undefined;

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    fiatCurrency: 'usd',
                }),
            );
        });

        it('should not specify country if country is not in the list', () => {
            state.wallet.tradingNew.buy.buyInfo!.buyInfo.country = 'XX';

            expect(selectBuyFormDefaultValues(state)).toEqual(
                expect.objectContaining({
                    country: undefined,
                }),
            );
        });
    });

    describe('selectBuySupportedFiatCurrencies', () => {
        it('should select supportedFiatCurrencies', () => {
            expect(selectBuySupportedFiatCurrencies(state)).toEqual(['usd', 'eur', 'czk']);
        });

        it('should return stable empty array when supportedFiatCurrencies are not set', () => {
            state.wallet.tradingNew.buy.buyInfo = undefined;

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
            state.wallet.tradingNew.buy.buyInfo!.supportedFiatCurrencies = [
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
            state.wallet.tradingNew.buy.quotes = [
                ...quotes,
                { ...quotes[0], exchange: 'simplex', orderId: 'order_id_4' },
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
            beforeAll(() => {
                Platform.OS = 'android';
                (Platform.select as jest.Mock).mockImplementation(
                    specifics => specifics.android ?? specifics.default,
                );
            });

            afterAll(() => {
                Platform.OS = 'ios';
                (Platform.select as jest.Mock).mockImplementation(
                    specifics => specifics.ios ?? specifics.default,
                );
            });

            it('should ignore applePay', () => {
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
            state.wallet.tradingNew.buy.quotes = quotes as BuyTrade[];
        });

        it('should return only best quote for each payment method', () => {
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
                ...quotes[0],
                paymentMethod: undefined,
            } as unknown as BuyTrade;

            state.wallet.tradingNew.buy.quotes = [quote];

            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });

        it('should ignore quotes without payment method name', () => {
            const quote = {
                ...quotes[0],
                paymentMethodName: undefined,
            } as unknown as BuyTrade;

            state.wallet.tradingNew.buy.quotes = [quote];

            expect(selectBuyBestQuotesForAvailablePaymentMethods(state)).toEqual([]);
        });
    });

    describe('selectMobileBuyQuotesByPaymentMethod', () => {
        beforeEach(() => {
            state.wallet.tradingNew.buy.quotes = [
                ...quotes,
                { ...quotes[0], exchange: 'simplex', orderId: 'order_id_4' },
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
