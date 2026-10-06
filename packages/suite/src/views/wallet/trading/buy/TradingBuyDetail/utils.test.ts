import { type BuyTradeStatus } from 'invity-api';

import { type TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/utils';

import {
    type BuyDetailStatusStep,
    getBuyDetailHeaderMessages,
    getBuyDetailProgress,
    getBuyDetailStatusStep,
} from './utils';

describe('getBuyDetailHeaderMessages', () => {
    it('returns the processing header once the user has paid (APPROVAL_PENDING)', () => {
        expect(getBuyDetailHeaderMessages('APPROVAL_PENDING')).toEqual({
            title: 'TR_TRADING_HEADER_PROCESSING_TITLE',
            description: 'TR_TRADING_HEADER_PROCESSING_DESCRIPTION',
        });
    });

    it.each<BuyTradeStatus | undefined>([
        'LOGIN_REQUEST',
        'REQUESTING',
        'SUBMITTED',
        'WAITING_FOR_USER',
        undefined,
    ])('returns the default header before payment (%s)', status => {
        expect(getBuyDetailHeaderMessages(status)).toEqual({
            title: 'TR_BUY_HEADER_TITLE',
            description: 'TR_TRADING_HEADER_DESCRIPTION',
        });
    });
});

describe('getBuyDetailStatusStep', () => {
    it.each<[BuyTradeStatus | undefined, BuyDetailStatusStep]>([
        ['LOGIN_REQUEST', undefined],
        ['REQUESTING', undefined],
        ['SUBMITTED', 'waiting'],
        ['WAITING_FOR_USER', 'waiting'],
        ['APPROVAL_PENDING', 'processing'],
        ['SUCCESS', 'success'],
        ['ERROR', 'error'],
        ['BLOCKED', 'error'],
        [undefined, undefined],
    ])('maps %s to the %s step', (tradeStatus, expected) => {
        expect(getBuyDetailStatusStep(tradeStatus)).toBe(expected);
    });
});

describe('getBuyDetailProgress', () => {
    it.each<[BuyTradeStatus | undefined, TradingDetailProgress]>([
        ['LOGIN_REQUEST', 'customerAction'],
        ['REQUESTING', 'customerAction'],
        ['SUBMITTED', 'customerAction'],
        ['WAITING_FOR_USER', 'customerAction'],
        ['APPROVAL_PENDING', 'providerProcessing'],
        ['SUCCESS', 'completed'],
        ['ERROR', 'customerAction'],
        ['BLOCKED', 'customerAction'],
        [undefined, 'customerAction'],
    ])('maps %s to %s', (tradeStatus, expected) => {
        expect(getBuyDetailProgress(tradeStatus)).toBe(expected);
    });
});
