import { asNetworkSymbol } from '@suite-common/wallet-config';

import * as blockbookService from './blockbook';
import * as coingeckoService from './coingecko';
import { createFetchBlockbookHttpCurrentRate } from './createFetchBlockbookHttpCurrentRate';
import { createFetchCoinGeckoCurrentRate } from './createFetchCoinGeckoCurrentRate';

jest.mock('./coingecko', () => ({ fetchCurrentFiatRates: jest.fn() }));
jest.mock('./blockbook', () => ({ fetchCurrentFiatRates: jest.fn() }));

const coingeckoFetch = jest.mocked(coingeckoService.fetchCurrentFiatRates);
const blockbookFetch = jest.mocked(blockbookService.fetchCurrentFiatRates);

const { signal } = new AbortController();

describe('current fiat rate fetchers', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('createFetchCoinGeckoCurrentRate', () => {
        const fetchRate = createFetchCoinGeckoCurrentRate();

        it('answers the rate in the requested currency', async () => {
            coingeckoFetch.mockResolvedValue({ ts: 100, rates: { eur: 90, usd: 100 } });

            await expect(
                fetchRate({ symbol: asNetworkSymbol('sol'), currency: 'eur', signal }),
            ).resolves.toEqual({
                rate: 90,
                timestamp: 100,
            });
            expect(coingeckoFetch).toHaveBeenCalledWith({ symbol: asNetworkSymbol('sol') });
        });

        it('quotes a token by its contract', async () => {
            coingeckoFetch.mockResolvedValue({ ts: 100, rates: { eur: 0.92 } });

            await fetchRate({
                symbol: asNetworkSymbol('eth'),
                currency: 'eur',
                signal,
                tokenAddress: '0xusdc',
            });

            expect(coingeckoFetch).toHaveBeenCalledWith({ symbol: 'eth', tokenAddress: '0xusdc' });
        });

        it.each([[null], [{ ts: 100, rates: {} }]])('answers null for %p', async response => {
            coingeckoFetch.mockResolvedValue(response);

            await expect(
                fetchRate({ symbol: asNetworkSymbol('sol'), currency: 'eur', signal }),
            ).resolves.toBeNull();
        });
    });

    describe('createFetchBlockbookHttpCurrentRate', () => {
        const fetchRate = createFetchBlockbookHttpCurrentRate();

        it('answers the Bitcoin rate', async () => {
            blockbookFetch.mockResolvedValue({ ts: 200, rates: { usd: 60000 } });

            await expect(
                fetchRate({ symbol: asNetworkSymbol('btc'), currency: 'usd', signal }),
            ).resolves.toEqual({
                rate: 60000,
                timestamp: 200,
            });
            expect(blockbookFetch).toHaveBeenCalledWith('btc', undefined, 'usd');
        });

        it('answers null for an unknown rate', async () => {
            blockbookFetch.mockResolvedValue({ ts: 200, rates: { usd: -1 } });

            await expect(
                fetchRate({ symbol: asNetworkSymbol('btc'), currency: 'usd', signal }),
            ).resolves.toBeNull();
        });

        it('answers null without asking for tokens', async () => {
            await expect(
                fetchRate({
                    symbol: asNetworkSymbol('btc'),
                    currency: 'usd',
                    signal,
                    tokenAddress: 'token',
                }),
            ).resolves.toBeNull();
            expect(blockbookFetch).not.toHaveBeenCalled();
        });

        it('answers null without asking for coins it does not serve', async () => {
            await expect(
                fetchRate({ symbol: asNetworkSymbol('ltc'), currency: 'usd', signal }),
            ).resolves.toBeNull();
            expect(blockbookFetch).not.toHaveBeenCalled();
        });
    });
});
