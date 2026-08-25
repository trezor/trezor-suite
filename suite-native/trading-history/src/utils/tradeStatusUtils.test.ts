import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import { getBuyTrade } from '@suite-native/trading-fixtures';

import {
    type TradeProgress,
    getBuyTradeProgress,
    getExchangeTradeProgress,
    getSellTradeProgress,
    getStepState,
    getTradeStatusUrl,
} from './tradeStatusUtils';

describe('tradeStatusUtils', () => {
    describe('trade progress mapping', () => {
        const buyCases: [BuyTradeStatus | undefined, TradeProgress | undefined][] = [
            [undefined, 'customerAction'],
            ['APPROVAL_PENDING', 'providerProcessing'],
            ['SUCCESS', 'completed'],
            ['ERROR', undefined],
        ];
        const sellCases: [SellTradeStatus | undefined, TradeProgress | undefined][] = [
            [undefined, 'customerAction'],
            ['PENDING', 'providerProcessing'],
            ['SUCCESS', 'completed'],
            ['REFUNDED', undefined],
        ];
        const exchangeCases: [ExchangeTradeStatus | undefined, TradeProgress | undefined][] = [
            [undefined, 'customerAction'],
            ['CONVERTING', 'providerProcessing'],
            ['SUCCESS', 'completed'],
            ['KYC', undefined],
        ];

        it.each(buyCases)('should map buy status %s to %s', (status, expectedProgress) => {
            expect(getBuyTradeProgress(status)).toBe(expectedProgress);
        });

        it.each(sellCases)('should map sell status %s to %s', (status, expectedProgress) => {
            expect(getSellTradeProgress(status)).toBe(expectedProgress);
        });

        it.each(exchangeCases)(
            'should map exchange status %s to %s',
            (status, expectedProgress) => {
                expect(getExchangeTradeProgress(status)).toBe(expectedProgress);
            },
        );
    });

    describe('getStepState', () => {
        it.each([
            ['customerAction', 'customerAction', 'active'],
            ['customerAction', 'providerProcessing', 'pending'],
            ['providerProcessing', 'customerAction', 'completed'],
            ['providerProcessing', 'providerProcessing', 'active'],
            ['completed', 'customerAction', 'completed'],
            ['completed', 'providerProcessing', 'completed'],
        ] as const)('should map %s progress and %s step to %s', (progress, step, state) => {
            expect(getStepState(progress, step)).toBe(state);
        });
    });

    describe('getTradeStatusUrl', () => {
        it('should prefer the status URL for a buy trade', () => {
            const statusUrl = 'https://example.com/buy-status';
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const trade = {
                ...buyTrade,
                data: { ...buyTrade.data, statusUrl },
            };

            expect(getTradeStatusUrl(trade)).toBe(statusUrl);
        });

        it('should use partner data for a buy trade without a status URL', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

            expect(getTradeStatusUrl(buyTrade)).toBe(buyTrade.data.partnerData);
        });
    });
});
