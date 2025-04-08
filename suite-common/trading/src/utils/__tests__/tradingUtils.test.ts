import { TradingType } from '../../types';
import { getBestRatedQuote } from '../tradingUtils';

describe('tradingUtils', () => {
    const quotes = [
        { rate: 1, exchange: 'exchange1' },
        { rate: 2, exchange: 'exchange2' },
        { rate: 0.5, exchange: 'exchange3' },
    ];

    describe('getBestRatedQuote', () => {
        it('should be undefined when no quotes are specified', () => {
            expect(getBestRatedQuote(undefined, 'buy')).toBeUndefined();
            expect(getBestRatedQuote([], 'buy')).toBeUndefined();
        });

        it('should select lowest rate for buy', () => {
            expect(getBestRatedQuote(quotes, 'buy')).toEqual({
                rate: 0.5,
                exchange: 'exchange3',
            });
        });

        it.each([['sell'], ['exchange']] as [TradingType][])(
            'should select highest rate for %s',
            type => {
                expect(getBestRatedQuote(quotes, type)).toEqual({
                    rate: 2,
                    exchange: 'exchange2',
                });
            },
        );
    });
});
