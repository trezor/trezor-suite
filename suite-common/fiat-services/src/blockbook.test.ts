import { buildHistoricRates } from './blockbook';

describe('buildHistoricRates', () => {
    const timestamps = [1631779200, 1631782800];

    test('maps a well-formed rates array, attaching the matching timestamp by index', () => {
        const rates = [{ rates: { usd: 100 } }, { rates: { usd: 200 } }];

        expect(buildHistoricRates('btc', rates, timestamps)).toEqual({
            ts: expect.any(Number),
            symbol: 'btc',
            tickers: [
                { rates: { usd: 100 }, ts: 1631779200 },
                { rates: { usd: 200 }, ts: 1631782800 },
            ],
        });
    });

    test('returns null on a fetch failure (null rates), preserving prior behavior', () => {
        expect(buildHistoricRates('btc', null, timestamps)).toBeNull();
    });

    test('returns null (no throw) for a truthy non-array poison response', () => {
        // A compromised/MITM *.trezor.io backend could return any shape; `.map` on a
        // non-array would otherwise throw and abort the whole fiat-rate/graph fetch.
        expect(() => buildHistoricRates('btc', { length: 2 }, timestamps)).not.toThrow();
        expect(buildHistoricRates('btc', { length: 2 }, timestamps)).toBeNull();
        expect(buildHistoricRates('btc', 'deadbeef', timestamps)).toBeNull();
        expect(buildHistoricRates('btc', 42, timestamps)).toBeNull();
    });

    test('handles an empty array (no requested timestamps) as an empty ticker set', () => {
        expect(buildHistoricRates('btc', [], [])).toEqual({
            ts: expect.any(Number),
            symbol: 'btc',
            tickers: [],
        });
    });

    test('does not throw on primitive/null poison entries within the array', () => {
        expect(() => buildHistoricRates('btc', [null, 'x'], timestamps)).not.toThrow();
    });
});
