import { getNetwork } from '@suite-common/wallet-config';
import type { TickerId } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { fetchCoinGeckoMarketChart, findClosestTimestampValue } from './coingecko';
import { fetchUrl } from './fetch';

jest.mock('@suite-common/wallet-config', () => ({ getNetwork: jest.fn() }));
jest.mock('./fetch', () => ({ fetchUrl: jest.fn() }));

const fetchUrlMock = jest.mocked(fetchUrl);
const getNetworkMock = jest.mocked(getNetwork);

const ticker = { symbol: 'btc' } as TickerId;
const fiatCurrency = 'usd' as BaseCurrencyCode;

describe('findClosestTimestampValue', () => {
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
});

describe('fetchCoinGeckoMarketChart', () => {
    beforeEach(() => {
        getNetworkMock.mockReturnValue({ nativeAssetCryptoId: 'bitcoin' } as ReturnType<
            typeof getNetwork
        >);
        fetchUrlMock.mockReset();
    });

    it('returns CoinGecko price pairs without changing their ordering or values', async () => {
        const prices: Array<[number, number]> = [
            [1_700_000_000_000, 106_448.7],
            [1_700_003_600_000, 106_500],
        ];
        fetchUrlMock.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ prices }),
        } as unknown as Response);

        const result = await fetchCoinGeckoMarketChart({
            ticker,
            fiatCurrency,
            days: 7,
        });

        expect(result).toEqual(prices);
        expect(fetchUrlMock).toHaveBeenCalledWith(
            'https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7',
            expect.anything(),
        );
    });
});
