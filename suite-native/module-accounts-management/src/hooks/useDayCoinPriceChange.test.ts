import {
    fetchErc4626UnderlyingAsset,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
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
    },
};

const mockFetchedRates = (weekAgoRate: number, currentRate: number) => {
    getFiatRatesForTimestampsMock.mockResolvedValue({
        ts: 0,
        symbol: ethSymbol,
        tickers: [
            { ts: 0, rates: { usd: weekAgoRate } },
            { ts: 0, rates: { usd: currentRate } },
        ],
    });
};

describe('useDayCoinPriceChange', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns fiat rates of a regular token', async () => {
        mockFetchedRates(100, 110);

        const { result } = renderHookWithStoreProvider(
            () => useDayCoinPriceChange({ symbol: ethSymbol, tokenContract: underlyingContract }),
            { preloadedState },
        );

        await waitFor(() => {
            expect(result.current.currentValue?.toNumber()).toBe(110);
        });

        expect(result.current.valuePercentageChange).toBeCloseTo(10 / 105);
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
        mockFetchedRates(100, 110);
        fetchErc4626UnderlyingAssetMock.mockResolvedValue({
            contract: underlyingContract,
            exchangeRate: new BigNumber('1.2'),
        });

        const { result } = renderHookWithStoreProvider(
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

        expect(result.current.valuePercentageChange).toBeCloseTo(10 / 105);
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

    it('returns null values when the vault data fetch fails', async () => {
        mockFetchedRates(100, 110);
        fetchErc4626UnderlyingAssetMock.mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHookWithStoreProvider(
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

        expect(result.current.currentValue).toBeNull();
        expect(result.current.valuePercentageChange).toBeNull();
    });
});
