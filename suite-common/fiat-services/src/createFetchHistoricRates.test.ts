import { asNetworkSymbol } from '@suite-common/wallet-config';

import * as blockbookService from './blockbook';
import * as coingeckoService from './coingecko';
import { createFetchBlockbookHttpHistoricRates } from './createFetchBlockbookHttpHistoricRates';
import { createFetchCoinGeckoHistoricRates } from './createFetchCoinGeckoHistoricRates';

jest.mock('./coingecko', () => ({ getFiatRatesForTimestamps: jest.fn() }));
jest.mock('./blockbook', () => ({ getFiatRatesForTimestamps: jest.fn() }));

const coingeckoFetch = jest.mocked(coingeckoService.getFiatRatesForTimestamps);
const blockbookFetch = jest.mocked(blockbookService.getFiatRatesForTimestamps);

const { signal } = new AbortController();

describe('historic fiat rate fetchers', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('answers CoinGecko rates by time for a coin or a token', async () => {
        coingeckoFetch.mockResolvedValue({
            symbol: 'sol',
            ts: 0,
            tickers: [
                { ts: 100, rates: { eur: 90 } },
                { ts: 200, rates: {} },
            ],
        });

        await expect(
            createFetchCoinGeckoHistoricRates()({
                symbol: asNetworkSymbol('sol'),
                currency: 'eur',
                timestamps: [100, 200],
                signal,
                tokenAddress: 'Mint',
            }),
        ).resolves.toEqual({ 100: 90 });
        expect(coingeckoFetch).toHaveBeenCalledWith(
            { symbol: 'sol', tokenAddress: 'Mint' },
            [100, 200],
            'eur',
        );
    });

    it('answers public Blockbook rates for Bitcoin only', async () => {
        blockbookFetch.mockResolvedValue({
            symbol: 'btc',
            ts: 0,
            tickers: [
                { ts: 100, rates: { usd: 60000 } },
                { ts: 200, rates: { usd: -1 } },
            ],
        });
        const fetchRates = createFetchBlockbookHttpHistoricRates();

        await expect(
            fetchRates({
                symbol: asNetworkSymbol('btc'),
                currency: 'usd',
                timestamps: [100, 200],
                signal,
            }),
        ).resolves.toEqual({ 100: 60000 });
        await expect(
            fetchRates({
                symbol: asNetworkSymbol('ltc'),
                currency: 'usd',
                timestamps: [100],
                signal,
            }),
        ).resolves.toEqual({});
        expect(blockbookFetch).toHaveBeenCalledTimes(1);
    });
});
