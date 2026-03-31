import { asTimestamp } from '@suite-common/wallet-types';

import {
    fetchGraphHistoricFiatRates,
    findClosestTimestampValue,
    isGraphHistoricResolutionCoverageStale,
    isGraphHistoricResolutionStale,
    mergeGraphHistoricFiatSeries,
} from '../src/coingecko';

jest.mock('../src/fetch', () => ({
    fetchUrl: jest.fn(),
}));

const mockedFetchUrl = jest.requireMock('../src/fetch').fetchUrl as jest.Mock;

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

    test('merges graph series in max <- month <- day order', () => {
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

    test('marks graph day resolution as stale after one hour', () => {
        const now = Date.UTC(2026, 0, 1);

        expect(isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000), 'day', now)).toBe(
            false,
        );
        expect(
            isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000 - 1), 'day', now),
        ).toBe(true);
    });

    test('marks graph month resolution as stale after one hour', () => {
        const now = Date.UTC(2026, 0, 1);

        expect(
            isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000), 'month', now),
        ).toBe(false);
        expect(
            isGraphHistoricResolutionStale(asTimestamp(now - 60 * 60 * 1000 - 1), 'month', now),
        ).toBe(true);
    });

    test('marks graph day resolution as stale when its last point lags by more than one hour', () => {
        const now = Date.UTC(2026, 0, 1);
        const freshLastPointTimestamp = now / 1000 - 60 * 60;
        const staleLastPointTimestamp = now / 1000 - 60 * 60 - 1;

        expect(isGraphHistoricResolutionCoverageStale(freshLastPointTimestamp, 'day', now)).toBe(
            false,
        );
        expect(isGraphHistoricResolutionCoverageStale(staleLastPointTimestamp, 'day', now)).toBe(
            true,
        );
    });

    test('does not mark non-day resolutions stale based on coverage lag', () => {
        const now = Date.UTC(2026, 0, 1);
        const staleLastPointTimestamp = now / 1000 - 24 * 60 * 60;

        expect(isGraphHistoricResolutionCoverageStale(staleLastPointTimestamp, 'month', now)).toBe(
            false,
        );
        expect(isGraphHistoricResolutionCoverageStale(staleLastPointTimestamp, 'max', now)).toBe(
            false,
        );
    });

    test('fetches day graph history from 1-day market chart endpoint', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: true,
            json: () => ({
                prices: [[1_710_000_000_000, 123.45]],
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
            expect.any(Object),
        );
    });

    test('falls back to 365-day market chart when max returns no points', async () => {
        mockedFetchUrl
            .mockResolvedValueOnce({
                ok: true,
                json: () => ({
                    prices: [],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => ({
                    prices: [[1_710_000_000_000, 321]],
                }),
            });

        await expect(
            fetchGraphHistoricFiatRates({
                baseCurrencyCode: 'czk',
                coinId: 'bitcoin',
                resolution: 'max',
            }),
        ).resolves.toEqual([{ time: 1_710_000_000, price: 321 }]);

        expect(mockedFetchUrl).toHaveBeenNthCalledWith(
            1,
            'https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart?vs_currency=czk&days=max',
            expect.any(Object),
        );
        expect(mockedFetchUrl).toHaveBeenNthCalledWith(
            2,
            'https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart?vs_currency=czk&days=365',
            expect.any(Object),
        );
    });
});
