import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import * as blockbookService from './blockbook';
import * as coingeckoService from './coingecko';
import { fetchCurrentFiatRates } from './rates';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { blockchainGetCurrentFiatRates: jest.fn() },
}));
jest.mock('./coingecko', () => ({ fetchCurrentFiatRates: jest.fn() }));
jest.mock('./blockbook', () => ({ fetchCurrentFiatRates: jest.fn() }));

const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');

const connectRates = jest.mocked(TrezorConnect.blockchainGetCurrentFiatRates);
const coingeckoRates = jest.mocked(coingeckoService.fetchCurrentFiatRates);
const blockbookRates = jest.mocked(blockbookService.fetchCurrentFiatRates);

describe('fetchCurrentFiatRates', () => {
    beforeEach(() => jest.clearAllMocks());

    it('asks Blockbook for dollars next to the chosen currency', async () => {
        connectRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { czk: 50000, usd: 2500 } },
        } as never);

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'czk',
        });

        expect(connectRates).toHaveBeenCalledWith(
            expect.objectContaining({ currencies: ['czk', 'usd'] }),
        );
        expect(result).toMatchObject({ rate: 50000, usdRate: 2500 });
    });

    it('asks Blockbook for dollars once when they are the chosen currency', async () => {
        connectRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { usd: 2500 } },
        } as never);

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'usd',
        });

        expect(connectRates).toHaveBeenCalledWith(expect.objectContaining({ currencies: ['usd'] }));
        expect(result).toMatchObject({ rate: 2500, usdRate: 2500 });
    });

    it('answers with no rate at all where Blockbook does not know the dollars', async () => {
        connectRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { eur: 2000, usd: -1 } },
        } as never);

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'eur',
        });

        expect(result).toBeNull();
    });

    it('answers with no rate at all where CoinGecko lacks the chosen currency', async () => {
        coingeckoRates.mockResolvedValue({ ts: 1, rates: { usd: 2500 } });

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'gbp',
            skipCache: true,
        });

        expect(result).toBeNull();
    });

    it('keeps a rate of zero: it is an answer, not a gap', async () => {
        connectRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { czk: 0, usd: 0 } },
        } as never);

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'czk',
        });

        expect(result).toMatchObject({ rate: 0, usdRate: 0 });
    });

    it('keeps the dollars CoinGecko always answers with', async () => {
        coingeckoRates.mockResolvedValue({ ts: 1, rates: { gbp: 1900, usd: 2500 } });

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'gbp',
            skipCache: true,
        });

        expect(connectRates).not.toHaveBeenCalled();
        expect(result).toMatchObject({ rate: 1900, usdRate: 2500 });
    });

    it('keeps the dollars when Blockbook has no ticker and CoinGecko answers instead', async () => {
        connectRates.mockResolvedValue({
            success: false,
            payload: { error: 'No tickers found!' },
            error: { message: 'No tickers found!' },
        } as never);
        coingeckoRates.mockResolvedValue({ ts: 1, rates: { chf: 2200, usd: 2500 } });

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: ETH },
            localCurrency: 'chf',
        });

        expect(result).toMatchObject({ rate: 2200, usdRate: 2500 });
    });

    it('takes every currency from Blockbook behind Electrum, dollars among them', async () => {
        blockbookRates.mockResolvedValue({ ts: 1, rates: { jpy: 9000000, usd: 60000 } });

        const result = await fetchCurrentFiatRates({
            ticker: { symbol: BTC },
            localCurrency: 'jpy',
            backendType: 'electrum',
        });

        expect(blockbookRates).toHaveBeenCalledWith('btc');
        expect(result).toMatchObject({ rate: 9000000, usdRate: 60000 });
    });
});
