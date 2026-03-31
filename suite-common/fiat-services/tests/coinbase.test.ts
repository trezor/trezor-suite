import { smoothCoinbaseLivePriceTicks, trimCoinbaseLivePriceHistory } from '../src/coinbase';

describe('coinbase live helpers', () => {
    test('smoothCoinbaseLivePriceTicks applies EMA progressively', () => {
        expect(
            smoothCoinbaseLivePriceTicks([
                { time: 1, price: 100 },
                { time: 2, price: 110 },
                { time: 3, price: 120 },
            ]),
        ).toEqual([
            { time: 1, price: 100 },
            { time: 2, price: 101 },
            { time: 3, price: 102.9 },
        ]);
    });

    test('trimCoinbaseLivePriceHistory keeps the left-edge anchor point', () => {
        expect(
            trimCoinbaseLivePriceHistory(
                [
                    { time: 1, price: 100 },
                    { time: 10, price: 110 },
                    { time: 20, price: 120 },
                ],
                15,
            ),
        ).toEqual([
            { time: 10, price: 110 },
            { time: 20, price: 120 },
        ]);
    });

    test('trimCoinbaseLivePriceHistory preserves the newest point if all are stale', () => {
        expect(
            trimCoinbaseLivePriceHistory(
                [
                    { time: 1, price: 100 },
                    { time: 2, price: 101 },
                ],
                100,
            ),
        ).toEqual([{ time: 2, price: 101 }]);
    });
});
