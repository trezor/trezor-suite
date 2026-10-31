import { fetchCoinGeckoMarketChart } from '@suite-common/fiat-services';
import { type TickerId, type TokenAddress } from '@suite-common/wallet-types';

import { fetchAssetPriceHistory } from './fetchAssetPriceHistory';
import { AssetPriceChartRange } from '../config/assetPriceChartRange';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCoinGeckoMarketChart: jest.fn(),
}));

const VAULT_TICKER: TickerId = {
    symbol: 'eth' as TickerId['symbol'],
    tokenAddress: '0xE4DB1c5A1B709CE4d2adA6985D9D506e58F73829' as TokenAddress,
    protocols: ['erc4626'],
};

const fetchVaultHistory = () =>
    fetchAssetPriceHistory({
        ticker: VAULT_TICKER,
        fiatCurrency: 'usd',
        range: AssetPriceChartRange.Month,
    });

describe('fetchAssetPriceHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('charts a vault token at its own market price, not its underlying asset', async () => {
        jest.mocked(fetchCoinGeckoMarketChart).mockResolvedValue([
            [1000, 1.01],
            [2000, 1.02],
        ]);

        const points = await fetchVaultHistory();

        expect(fetchCoinGeckoMarketChart).toHaveBeenCalledWith(
            expect.objectContaining({ ticker: VAULT_TICKER }),
        );
        expect(points).toEqual([
            { timestamp: 1000, price: 1.01 },
            { timestamp: 2000, price: 1.02 },
        ]);
    });

    it('has no chart for a token the market does not price', async () => {
        jest.mocked(fetchCoinGeckoMarketChart).mockResolvedValue(null);

        expect(await fetchVaultHistory()).toBeNull();
    });
});
