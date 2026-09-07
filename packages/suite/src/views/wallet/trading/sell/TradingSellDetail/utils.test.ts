import { type SellTradeStatus } from 'invity-api';

import { type TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/utils';

import {
    type SellDetailStatusStep,
    getSellDetailHeaderMessages,
    getSellDetailProgress,
    getSellDetailStatusStep,
} from './utils';

describe('getSellDetailHeaderMessages', () => {
    it.each<SellTradeStatus>([
        'REQUESTING',
        'LOGIN_REQUEST',
        'SITE_ACTION_REQUEST',
        'SUBMITTED',
        'SEND_CRYPTO',
    ])('returns the default header before crypto is sent (%s)', status => {
        expect(getSellDetailHeaderMessages(status)).toEqual({
            title: 'TR_SELL_HEADER_TITLE',
            description: 'TR_TRADING_HEADER_DESCRIPTION',
        });
    });

    it.each<SellTradeStatus>(['PENDING', 'SUCCESS'])(
        'returns the processing header once crypto is sent (%s)',
        status => {
            expect(getSellDetailHeaderMessages(status)).toEqual({
                title: 'TR_TRADING_HEADER_PROCESSING_TITLE',
                description: 'TR_TRADING_HEADER_PROCESSING_DESCRIPTION',
            });
        },
    );
});

describe('getSellDetailStatusStep', () => {
    it.each<[SellTradeStatus, SellDetailStatusStep]>([
        ['REQUESTING', 'pending'],
        ['LOGIN_REQUEST', 'pending'],
        ['SITE_ACTION_REQUEST', 'pending'],
        ['SUBMITTED', 'pending'],
        ['SEND_CRYPTO', 'pending'],
        ['PENDING', 'pending'],
        ['SUCCESS', 'success'],
        ['ERROR', 'error'],
        ['BLOCKED', 'error'],
        ['CANCELLED', 'error'],
        ['REFUNDED', 'error'],
    ])('maps %s to the %s step', (tradeStatus, expected) => {
        expect(getSellDetailStatusStep(tradeStatus)).toBe(expected);
    });
});

describe('getSellDetailProgress', () => {
    it.each<[SellTradeStatus, TradingDetailProgress]>([
        ['REQUESTING', 'customerAction'],
        ['LOGIN_REQUEST', 'customerAction'],
        ['SITE_ACTION_REQUEST', 'customerAction'],
        ['SUBMITTED', 'customerAction'],
        ['SEND_CRYPTO', 'customerAction'],
        ['PENDING', 'providerProcessing'],
        ['SUCCESS', 'completed'],
        ['ERROR', 'completed'],
        ['BLOCKED', 'completed'],
        ['CANCELLED', 'completed'],
        ['REFUNDED', 'completed'],
    ])('maps %s to %s', (tradeStatus, expected) => {
        expect(getSellDetailProgress(tradeStatus)).toBe(expected);
    });
});
