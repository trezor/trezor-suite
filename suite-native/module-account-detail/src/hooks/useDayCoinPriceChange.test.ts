import {
    fetchErc4626UnderlyingAsset,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { useDayCoinPriceChange } from './useDayCoinPriceChange';

jest.mock('@suite-common/fiat-services', () => ({
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const fetchErc4626UnderlyingAssetMock = jest.mocked(fetchErc4626UnderlyingAsset);
const getFiatRatesForTimestampsMock = jest.mocked(getFiatRatesForTimestamps);

const ethSymbol = asNetworkSymbol('eth');
const vaultContract = toTokenAddress('0x90551c1795392094FE6D29B758EcCD233cFAa260');
const underlyingContract = toTokenAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

const preloadedState = {
    wallet: {
        settings: { localCurrency: 'usd' },
        blockchain: { eth: { backends: {} } },
        fiat: {
            current: {
                [getFiatRateKey(ethSymbol, 'usd', underlyingContract)]: {
                    rate: 110,
                    isLoading: false,
                },
                [getFiatRateKey(ethSymbol, 'usd', vaultContract)]: {
                    rate: 132,
                    isLoading: false,
                },
            },
        },
    },
};

const mockFetchedHistoricalRate = (weekAgoRate: number | null) => {
    getFiatRatesForTimestampsMock.mockImplementation((_ticker, timestamps) => {
        const [requestedTimestamp] = timestamps;

        if (requestedTimestamp === undefined || timestamps.length !== 1) {
            throw new Error('Expected one timestamp');
        }

        return Promise.resolve({
            ts: 0,
            symbol: ethSymbol,
            // Providers return their authoritative timestamps, which can differ from those requested.
            tickers:
                weekAgoRate === null
                    ? []
                    : [{ ts: requestedTimestamp + 60, rates: { usd: weekAgoRate } }],
        });
    });
};

describe('useDayCoinPriceChange', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns fiat rates of a regular token', async () => {
        mockFetchedHistoricalRate(100);

        const { result } = await renderHookWithStoreProvider(
            () => useDayCoinPriceChange({ symbol: ethSymbol, tokenContract: underlyingContract }),
            { preloadedState },
        );

        await waitFor(() => {
            expect(result.current.currentValue?.toNumber()).toBe(110);
        });

        expect(result.current.valuePercentageChange).toBeCloseTo(0.1);
        expect(result.current.underlyingAssetContract).toBeNull();
        expect(fetchErc4626UnderlyingAssetMock).not.toHaveBeenCalled();
        expect(getFiatRatesForTimestampsMock).toHaveBeenCalledWith(
            { symbol: ethSymbol, tokenAddress: underlyingContract },
            expect.any(Array),
            'usd',
            false,
            false,
        );
    });

    it('scales the underlying asset rates by the vault exchange rate for an ERC4626 token', async () => {
        mockFetchedHistoricalRate(100);
        fetchErc4626UnderlyingAssetMock.mockResolvedValue({
            contract: underlyingContract,
            exchangeRate: new BigNumber('1.2'),
        });

        const { result } = await renderHookWithStoreProvider(
            () =>
                useDayCoinPriceChange({
                    symbol: ethSymbol,
                    tokenContract: vaultContract,
                    isErc4626Token: true,
                }),
            { preloadedState },
        );

        await waitFor(() => {
            expect(result.current.currentValue?.toNumber()).toBe(132);
        });

        expect(result.current.valuePercentageChange).toBeCloseTo(0.1);
        expect(result.current.underlyingAssetContract).toBe(underlyingContract);
        expect(fetchErc4626UnderlyingAssetMock).toHaveBeenCalledWith({
            coin: ethSymbol,
            contract: vaultContract,
        });
        expect(getFiatRatesForTimestampsMock).toHaveBeenCalledWith(
            { symbol: ethSymbol, tokenAddress: underlyingContract },
            expect.any(Array),
            'usd',
            false,
            false,
        );
    });

    it('keeps the current price when the vault historical data fetch fails', async () => {
        mockFetchedHistoricalRate(100);
        fetchErc4626UnderlyingAssetMock.mockRejectedValue(new Error('Fetch failed'));

        const { result } = await renderHookWithStoreProvider(
            () =>
                useDayCoinPriceChange({
                    symbol: ethSymbol,
                    tokenContract: vaultContract,
                    isErc4626Token: true,
                }),
            { preloadedState },
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.currentValue?.toNumber()).toBe(132);
        expect(result.current.valuePercentageChange).toBeNull();
        expect(result.current.underlyingAssetContract).toBeNull();
    });

    it('keeps the current price when the historical rate is missing', async () => {
        mockFetchedHistoricalRate(null);

        const { result } = await renderHookWithStoreProvider(
            () => useDayCoinPriceChange({ symbol: ethSymbol, tokenContract: underlyingContract }),
            { preloadedState },
        );

        await waitFor(() => {
            expect(result.current.currentValue?.toNumber()).toBe(110);
        });

        expect(result.current.valuePercentageChange).toBeNull();
    });
});
