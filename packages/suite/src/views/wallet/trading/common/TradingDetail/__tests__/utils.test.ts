import { type BuyTradeStatus, type SellTradeStatus } from 'invity-api';

import { getBuyDetailHeaderMessages, getSellDetailHeaderMessages } from '../utils';

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
