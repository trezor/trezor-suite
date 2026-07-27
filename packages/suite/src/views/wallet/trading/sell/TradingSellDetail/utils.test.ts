import { type SellTradeStatus } from 'invity-api';

import { getSellDetailHeaderMessages } from './utils';

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
