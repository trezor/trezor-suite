import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { TradingTransaction, TradingType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../../__fixtures__/trades';
import { INVITY_CALLBACK_TREZOR_BUY_URL, TRADING_URL_DEFAULT_BACK } from '../formUtils';
import {
    doesUrlContainCloseCallbackUrl,
    getRandomAccountDescriptor,
    getTradeOperationData,
    getTradeStatusStep,
    getTradeTitle,
    isFinalStatus,
} from '../utils';

describe('utils', () => {
    describe('getTradeOperationData', () => {
        it('should return correct data for buy trade', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const result = getTradeOperationData(buyTrade.data);

            expect(result).toEqual({
                fromValue: '1234',
                fromCurrency: 'USD',
                toValue: '0.462586',
                toCurrency: 'ethereum',
                isFromCrypto: false,
                isToCrypto: true,
            });
        });

        it('should return correct data for exchange trade', () => {
            const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
            const result = getTradeOperationData(exchangeTrade.data);

            expect(result).toEqual({
                fromValue: '10.1232',
                fromCurrency: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
                toValue: '0.462586',
                toCurrency: 'solana',
                isFromCrypto: true,
                isToCrypto: true,
            });
        });

        it('should return correct data for sell trade', () => {
            const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });
            const result = getTradeOperationData(sellTrade.data);

            expect(result).toEqual({
                fromValue: '1.22',
                fromCurrency: 'bitcoin',
                toValue: '100',
                toCurrency: 'USD',
                isFromCrypto: true,
                isToCrypto: false,
            });
        });

        it('should return undefined values for undefined transaction', () => {
            const result = getTradeOperationData(undefined);

            expect(result).toEqual({
                fromValue: undefined,
                fromCurrency: undefined,
                toValue: undefined,
                toCurrency: undefined,
            });
        });
    });

    describe('isFinalStatus', () => {
        it.each([
            ['buy', 'SUCCESS', true],
            ['buy', 'ERROR', true],
            ['buy', 'BLOCKED', true],
            ['buy', 'SUBMITTED', false],
            ['buy', 'WAITING_FOR_USER', false],
            ['buy', 'APPROVAL_PENDING', false],
            ['buy', undefined, false],
            ['sell', 'SUCCESS', true],
            ['sell', 'ERROR', true],
            ['sell', 'BLOCKED', true],
            ['sell', 'CANCELLED', true],
            ['sell', 'REFUNDED', true],
            ['sell', 'SEND_CRYPTO', false],
            ['sell', 'SUBMITTED', false],
            ['sell', undefined, false],
            ['exchange', 'SUCCESS', true],
            ['exchange', 'ERROR', true],
            ['exchange', 'KYC', true],
            ['exchange', 'CONVERTING', false],
            ['exchange', 'APPROVAL_PENDING', false],
            ['exchange', undefined, false],
        ])('should return %s for %s trade with %s status', (tradeType, status, expectedResult) => {
            expect(isFinalStatus(tradeType as any, status as any)).toBe(expectedResult);
        });
    });

    describe('getTradeStatusStep', () => {
        it.each([
            ['SUBMITTED', 'waiting'],
            ['WAITING_FOR_USER', 'waiting'],
            ['APPROVAL_PENDING', 'processing'],
            ['SUCCESS', 'success'],
            ['ERROR', 'error'],
            ['BLOCKED', 'error'],
            [undefined, undefined],
        ])('should return correct step for buy trade with %s status', (status, expectedStep) => {
            const trade = getBuyTrade({ status: status as BuyTradeStatus });
            expect(getTradeStatusStep(trade)).toBe(expectedStep);
        });

        it.each([
            ['CONVERTING', 'converting'],
            ['KYC', 'kyc'],
            ['ERROR', 'error'],
            ['SUCCESS', 'success'],
            ['APPROVAL_PENDING', 'sending'],
            [undefined, undefined],
        ])(
            'should return correct step for exchange trade with %s status',
            (status, expectedStep) => {
                const trade = getExchangeTrade({ status: status as ExchangeTradeStatus });
                expect(getTradeStatusStep(trade)).toBe(expectedStep);
            },
        );

        it.each([
            ['SEND_CRYPTO', 'pending'],
            ['SUCCESS', 'success'],
            ['ERROR', 'error'],
            ['BLOCKED', 'error'],
            ['CANCELLED', 'error'],
            ['REFUNDED', 'error'],
            [undefined, undefined],
        ])('should return correct step for sell trade with %s status', (status, expectedStep) => {
            const trade = getSellTrade({ status: status as SellTradeStatus });
            expect(getTradeStatusStep(trade)).toBe(expectedStep);
        });
    });

    describe('doesUrlContainCloseCallbackUrl', () => {
        const closeCallbackUrl = 'trezorsuitelite://trading';

        it('should return true when URL contains closeCallbackUrl', () => {
            const url = 'trezorsuitelite://trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });

        it('should return true when URL contains TRADING_URL_DEFAULT_BACK', () => {
            const url = `${TRADING_URL_DEFAULT_BACK}?action=trade&tradeType=buy&orderId=123`;
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });

        it('should return true when URL contains INVITY_CALLBACK_TREZOR_BUY_URL', () => {
            const url = `${INVITY_CALLBACK_TREZOR_BUY_URL}?action=trade&tradeType=buy&orderId=123`;
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });

        it('should return false when URL contains neither closeCallbackUrl nor TRADING_URL_DEFAULT_BACK', () => {
            const url = 'https://example.com/trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(false);
        });

        it('should handle empty URL', () => {
            expect(doesUrlContainCloseCallbackUrl('', closeCallbackUrl)).toBe(false);
        });

        it('should handle URL with special characters', () => {
            const url =
                'trezorsuitelite://trading?action=trade&tradeType=buy&orderId=dd070b73-fe29-4769-8be1-4075d6b43265&transactionId=8c9476a7-958b-412b-a378-3a3f59b6105a&baseCurrencyCode=czk&baseCurrencyAmount=384.78&transactionStatus=completed';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });
    });

    describe('getRandomAccountDescriptor', () => {
        it('should return 20 characters', () => {
            expect(getRandomAccountDescriptor().length).toBe(20);
        });

        it('should return different string on every call', () => {
            expect(getRandomAccountDescriptor()).not.toBe(getRandomAccountDescriptor());
        });
    });

    describe('getTradeTitle', () => {
        it.each<[string, TradingType]>([
            ['Buy', 'buy'],
            ['Sell', 'sell'],
            ['Swap', 'exchange'],
        ])('should return "%s" for [%s] tradeType', (expectedTitle, tradeType) => {
            const trade = { tradeType } as TradingTransaction;
            const { result } = renderHookWithBasicProvider(() => useTranslate());

            expect(getTradeTitle(trade, result.current.translate)).toBe(expectedTitle);
        });
    });
});
