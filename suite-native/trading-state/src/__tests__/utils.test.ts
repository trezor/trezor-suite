import { getFormDraftKeyByTradeType } from '../utils';

describe('utils', () => {
    describe('getFormDraftKeyByTradeType', () => {
        it('should return correct form draft key for exchange trade type', () => {
            const result = getFormDraftKeyByTradeType('exchange');
            expect(result).toBe('trading-exchange/');
        });

        it('should return correct form draft key for sell trade type', () => {
            const result = getFormDraftKeyByTradeType('sell');
            expect(result).toBe('trading-sell/');
        });
    });
});
