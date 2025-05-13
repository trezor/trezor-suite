import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../__fixtures__/trades';
import { TRADING_URL_DEFAULT_BACK } from '../tradeFormUtils';
import {
    doesUrlContainCloseCallbackUrl,
    getRandomAccountDescriptor,
    getTradeOperationData,
    getTradeStatusStep,
    isFinalStatus,
} from '../tradeUtils';

describe('tradeUtils', () => {
    describe('getTradeOperationData', () => {
        it('should return correct data for buy trade', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const result = getTradeOperationData(buyTrade);

            expect(result).toEqual({
                fromValue: '1234',
                fromCryptoId: 'USD',
                toValue: '0.462586',
                toCryptoId: 'ethereum',
            });
        });

        it('should return correct data for exchange trade', () => {
            const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
            const result = getTradeOperationData(exchangeTrade);

            expect(result).toEqual({
                fromValue: '10.1232',
                fromCryptoId: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
                toValue: '0.462586',
                toCryptoId: 'solana',
            });
        });

        it('should return correct data for sell trade', () => {
            const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });
            const result = getTradeOperationData(sellTrade);

            expect(result).toEqual({
                fromValue: '1.22',
                fromCryptoId: 'bitcoin',
                toValue: '100',
                toCryptoId: 'USD',
            });
        });

        it('should return undefined values for undefined transaction', () => {
            const result = getTradeOperationData(undefined);

            expect(result).toEqual({
                fromValue: undefined,
                fromCryptoId: undefined,
                toValue: undefined,
                toCryptoId: undefined,
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
            ['SUBMITTED', 'status-waiting'],
            ['WAITING_FOR_USER', 'status-waiting'],
            ['APPROVAL_PENDING', 'status-processing'],
            ['SUCCESS', 'status-success'],
            ['ERROR', 'status-error'],
            ['BLOCKED', 'status-error'],
            [undefined, undefined],
        ])('should return correct step for buy trade with %s status', (status, expectedStep) => {
            const trade = getBuyTrade({ status: status as BuyTradeStatus });
            expect(getTradeStatusStep(trade)).toBe(expectedStep);
        });

        it.each([
            ['CONVERTING', 'status-converting'],
            ['KYC', 'status-kyc'],
            ['ERROR', 'status-error'],
            ['SUCCESS', 'status-success'],
            ['APPROVAL_PENDING', 'status-sending'],
            [undefined, undefined],
        ])(
            'should return correct step for exchange trade with %s status',
            (status, expectedStep) => {
                const trade = getExchangeTrade({ status: status as ExchangeTradeStatus });
                expect(getTradeStatusStep(trade)).toBe(expectedStep);
            },
        );

        it.each([
            ['SEND_CRYPTO', 'status-pending'],
            ['SUCCESS', 'status-success'],
            ['ERROR', 'status-error'],
            ['BLOCKED', 'status-error'],
            ['CANCELLED', 'status-error'],
            ['REFUNDED', 'status-error'],
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
});
