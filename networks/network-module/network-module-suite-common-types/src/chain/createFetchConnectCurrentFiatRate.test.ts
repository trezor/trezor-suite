import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type FetchConnectCurrentFiatRateDeps,
    createFetchConnectCurrentFiatRate,
} from './createFetchConnectCurrentFiatRate';

const mockGetCurrentFiatRates = jest.fn();
const mockFetchCoinGeckoCurrentRate = jest.fn();

const deps: FetchConnectCurrentFiatRateDeps = {
    getTrezorConnect: () => ({ blockchainGetCurrentFiatRates: mockGetCurrentFiatRates }),
    fetchCoinGeckoCurrentRate: mockFetchCoinGeckoCurrentRate,
};

const fetchCurrentFiatRate = createFetchConnectCurrentFiatRate(deps);

const params = {
    symbol: asNetworkSymbol('btc'),
    currency: 'usd',
    signal: new AbortController().signal,
} as const;

describe('createFetchConnectCurrentFiatRate', () => {
    beforeEach(() => {
        mockGetCurrentFiatRates.mockReset();
        mockFetchCoinGeckoCurrentRate.mockReset();
    });

    it('answers the Blockbook rate', async () => {
        mockGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1700000000, rates: { usd: 50000 } },
        });

        await expect(fetchCurrentFiatRate(params)).resolves.toEqual({
            rate: 50000,
            timestamp: 1700000000,
        });
        expect(mockGetCurrentFiatRates).toHaveBeenCalledWith({ coin: 'btc', currencies: ['usd'] });
        expect(mockFetchCoinGeckoCurrentRate).not.toHaveBeenCalled();
    });

    it.each([[-1], [0], [undefined]])('answers null for the Blockbook rate %p', async rate => {
        mockGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1700000000, rates: { usd: rate } },
        });

        await expect(fetchCurrentFiatRate(params)).resolves.toBeNull();
    });

    it('asks CoinGecko when Blockbook has no tickers for the coin', async () => {
        mockGetCurrentFiatRates.mockResolvedValue({
            success: false,
            error: { message: 'No tickers found!' },
        });
        mockFetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 49000, timestamp: 1700000001 });

        await expect(fetchCurrentFiatRate(params)).resolves.toEqual({
            rate: 49000,
            timestamp: 1700000001,
        });
        expect(mockFetchCoinGeckoCurrentRate).toHaveBeenCalledWith(params);
    });

    it('answers null for any other Blockbook failure', async () => {
        mockGetCurrentFiatRates.mockResolvedValue({
            success: false,
            error: { message: 'Backend unavailable' },
        });

        await expect(fetchCurrentFiatRate(params)).resolves.toBeNull();
        expect(mockFetchCoinGeckoCurrentRate).not.toHaveBeenCalled();
    });
});
