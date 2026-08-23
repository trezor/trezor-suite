import { asTimestamp } from '@suite-common/wallet-types';

import {
    canRetryGraphHistoricFiatRates,
    fetchGraphHistoricFiatRates,
    findClosestTimestampValue,
    getGraphFiatCoinId,
    isGraphHistoricResolutionCoverageStale,
    isGraphHistoricResolutionStale,
    mergeGraphHistoricFiatSeries,
} from './coingecko';

jest.mock('./fetch', () => ({
    fetchUrl: jest.fn(),
}));

const mockedFetchUrl = jest.requireMock('./fetch').fetchUrl as jest.Mock;

describe('findClosestTimestampValue', () => {
    beforeEach(() => {
        mockedFetchUrl.mockReset();
    });

    test('returns the first fiat rate when timestamp is before all values', () => {
        const timestamp = 1631779100;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(100);
    });

    test('returns the correct fiat rate when timestamp is exact match', () => {
        const timestamp = 1631782800;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(200);
    });

    test('returns the closest fiat rate when timestamp is between two values', () => {
        const timestamp = 1631782900;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(200);
    });

    test('returns the last fiat rate when timestamp is after all values', () => {
        const timestamp = 1631787000;
        const prices: Array<[number, number]> = [
            [1631779200000, 100],
            [1631782800000, 200],
            [1631786400000, 300],
        ];
        expect(findClosestTimestampValue(timestamp, prices)).toEqual(300);
    });

    test('merges graph series from coarse to fine resolution', () => {
        expect(
            mergeGraphHistoricFiatSeries({
                max: [
                    { time: 100, price: 1 },
                    { time: 200, price: 2 },
                ],
                month: [{ time: 200, price: 20 }],
                day: [{ time: 200, price: 200 }],
            }),
        ).toEqual([
            { time: 100, price: 1 },
            { time: 200, price: 200 },
        ]);
    });

    test('uses resolution-specific freshness intervals', () => {
        const now = Date.UTC(2026, 0, 1);

        expect(isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000), 'day', now)).toBe(
            false,
        );
        expect(
            isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000 - 1), 'month', now),
        ).toBe(true);
        expect(
            isGraphHistoricResolutionStale(asTimestamp(now - 24 * 60 * 60 * 1000), 'max', now),
        ).toBe(false);
    });

    test('checks recent coverage only for the day resolution', () => {
        const now = Date.UTC(2026, 0, 1);
        const stalePoint = now / 1000 - 60 * 60 - 1;

        expect(isGraphHistoricResolutionCoverageStale(stalePoint, 'day', now)).toBe(true);
        expect(isGraphHistoricResolutionCoverageStale(stalePoint, 'month', now)).toBe(false);
        expect(isGraphHistoricResolutionCoverageStale(stalePoint, 'max', now)).toBe(false);
    });

    test('allows retrying failed graph requests after five minutes', () => {
        const now = Date.UTC(2026, 0, 1);

        expect(canRetryGraphHistoricFiatRates(null, now)).toBe(true);
        expect(canRetryGraphHistoricFiatRates(asTimestamp(now - 5 * 60 * 1000 + 1), now)).toBe(
            false,
        );
        expect(canRetryGraphHistoricFiatRates(asTimestamp(now - 5 * 60 * 1000), now)).toBe(true);
    });

    test.each([
        ['btc', 'bitcoin'],
        ['pol', 'polygon-ecosystem-token'],
        ['arb', 'ethereum'],
        ['rhc', 'ethereum'],
        ['hype', 'hyperliquid'],
    ] as const)('resolves the native graph price asset for %s', (symbol, expectedCoinId) => {
        expect(getGraphFiatCoinId(symbol)).toBe(expectedCoinId);
    });

    test.each(['test', 'regtest', 'tsep', 'thod', 'ttrx'] as const)(
        'does not resolve a graph price asset for testnet %s',
        symbol => {
            expect(getGraphFiatCoinId(symbol)).toBeUndefined();
        },
    );

    test('fetches and normalizes finite graph points', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: true,
            json: () => ({
                prices: [
                    [1_710_000_000_000, 123.45],
                    [Number.NaN, 10],
                    [1_710_000_100_000, Number.POSITIVE_INFINITY],
                    ['invalid', 42],
                ],
            }),
        });

        await expect(
            fetchGraphHistoricFiatRates({
                baseCurrencyCode: 'eur',
                coinId: 'bitcoin',
                resolution: 'day',
            }),
        ).resolves.toEqual([{ time: 1_710_000_000, price: 123.45 }]);
        expect(mockedFetchUrl).toHaveBeenCalledWith(
            'https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=1',
        );
    });

    test('rejects an empty graph response', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: true,
            json: () => ({ prices: [] }),
        });

        await expect(
            fetchGraphHistoricFiatRates({
                baseCurrencyCode: 'usd',
                coinId: 'bitcoin',
                resolution: 'max',
            }),
        ).rejects.toThrow('CoinGecko returned no valid historical prices.');
    });

    test('rejects malformed graph data without finite points', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: true,
            json: () => ({ prices: [['invalid']] }),
        });

        await expect(
            fetchGraphHistoricFiatRates({
                baseCurrencyCode: 'usd',
                coinId: 'bitcoin',
                resolution: 'month',
            }),
        ).rejects.toThrow('CoinGecko returned no valid historical prices.');
    });

    test('rejects an unsuccessful graph response', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: false,
            status: 403,
        });

        await expect(
            fetchGraphHistoricFiatRates({
                baseCurrencyCode: 'usd',
                coinId: 'bitcoin',
                resolution: 'max',
            }),
        ).rejects.toThrow('CoinGecko returned no valid historical prices.');
    });
});
