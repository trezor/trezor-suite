import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../__fixtures__/trades';
import { getTradeOperationData, getTradeStatusStep, isFinalStatus } from '../tradeUtils';

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
});
