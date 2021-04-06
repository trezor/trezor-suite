import { getStatusMessage, formatIban } from '../sellUtils';

describe('coinmarket/sell utils', () => {
    it('formatIban', () => {
        expect(formatIban('SE35 5000 0000 0549 1000 0003')).toEqual(
            'SE35 5000 0000 0549 1000 0003',
        );
        expect(formatIban('CH9300762011623852957')).toEqual('CH93 0076 2011 6238 5295 7');
    });

    it('getStatusMessage', () => {
        expect(getStatusMessage('PENDING')).toBe('TR_SELL_STATUS_PENDING');
        expect(getStatusMessage('SUBMITTED')).toBe('TR_SELL_STATUS_PENDING');
        expect(getStatusMessage('ERROR')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('BLOCKED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('CANCELLED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('REFUNDED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_SELL_STATUS_SUCCESS');
    });
});
