import type { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';

import type { TradingTransaction, TradingType } from '@suite-common/trading';
import { type FormDraftKeyPrefix } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import {
    getErrorStrFromThunkRejectedValue,
    getFormDraftKeyPrefixFromTradingType,
    getRandomAccountDescriptor,
    getTradeStatusStep,
    getTradeTitle,
} from '../utils';

describe('utils', () => {
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

    describe('getFormDraftKeyPrefixFromTradingType', () => {
        it.each<[TradingType, FormDraftKeyPrefix]>([
            ['buy', 'trading-buy'],
            ['sell', 'trading-sell'],
            ['exchange', 'trading-exchange'],
        ])('should return correct prefix for %s', (tradingType, expectedPrefix) => {
            expect(getFormDraftKeyPrefixFromTradingType(tradingType)).toBe(expectedPrefix);
        });
    });

    describe('getErrorStrFromThunkRejectedValue', () => {
        it.each([
            [
                '[error]: message',
                {
                    error: { error: 'error', message: 'message' },
                },
            ],
            ['Error message', { error: { message: 'Error message' } }],
            ['Error message', new Error('Error message')],
            ['Just a string error', 'Just a string error'],
            ['Unknown error', { error: {} }],
            ['Unknown error', 42],
        ])('should return %s when called with %o', (expected, input) => {
            expect(getErrorStrFromThunkRejectedValue(input)).toBe(expected);
        });
    });
});
