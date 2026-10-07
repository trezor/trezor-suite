import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type FetchConnectHistoricFiatRatesDeps,
    createFetchConnectHistoricFiatRates,
} from './createFetchConnectHistoricFiatRates';

const mockGetFiatRatesForTimestamps = jest.fn();
const mockFetchCoinGeckoHistoricRates = jest.fn();

const deps: FetchConnectHistoricFiatRatesDeps = {
    getTrezorConnect: () => ({
        blockchainGetFiatRatesForTimestamps: mockGetFiatRatesForTimestamps,
    }),
    fetchCoinGeckoHistoricRates: mockFetchCoinGeckoHistoricRates,
};

const fetchHistoricRates = createFetchConnectHistoricFiatRates(deps);

const params = {
    symbol: asNetworkSymbol('eth'),
    currency: 'usd',
    timestamps: [100, 200, 300],
    signal: new AbortController().signal,
} as const;

describe('createFetchConnectHistoricFiatRates', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('matches each rate to its own time, even after an unknown one', async () => {
        mockGetFiatRatesForTimestamps.mockResolvedValue({
            success: true,
            payload: {
                tickers: [
                    { ts: 100, rates: { usd: -1 } },
                    { ts: 200, rates: { usd: 2000 } },
                    { ts: 300, rates: { usd: 3000 } },
                ],
            },
        });

        await expect(fetchHistoricRates(params)).resolves.toEqual({ 200: 2000, 300: 3000 });
    });

    it('asks Blockbook for the token when given one', async () => {
        mockGetFiatRatesForTimestamps.mockResolvedValue({
            success: true,
            payload: { tickers: [] },
        });

        await fetchHistoricRates({ ...params, tokenAddress: '0xusdc' });

        expect(mockGetFiatRatesForTimestamps).toHaveBeenCalledWith({
            coin: 'eth',
            token: '0xusdc',
            timestamps: [100, 200, 300],
            currencies: ['usd'],
        });
    });

    it('asks CoinGecko when Blockbook cannot answer', async () => {
        mockGetFiatRatesForTimestamps.mockResolvedValue({
            success: false,
            error: { message: 'unavailable' },
        });
        mockFetchCoinGeckoHistoricRates.mockResolvedValue({ 100: 1 });

        await expect(fetchHistoricRates(params)).resolves.toEqual({ 100: 1 });
        expect(mockFetchCoinGeckoHistoricRates).toHaveBeenCalledWith(params);
    });
});
