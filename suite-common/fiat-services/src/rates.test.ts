import TrezorConnect from '@trezor/connect';

import * as blockbookService from './blockbook';
import * as coingeckoService from './coingecko';
import { getFiatRatesForTimestamps } from './rates';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainGetFiatRatesForTimestamps: jest.fn(),
    },
}));

jest.mock('../src/blockbook', () => ({
    getFiatRatesForTimestamps: jest.fn(),
}));

jest.mock('../src/coingecko', () => ({
    getFiatRatesForTimestamps: jest.fn(),
}));

const getFiatRatesForTimestampsMock = jest.mocked(
    TrezorConnect.blockchainGetFiatRatesForTimestamps,
);
const getBlockbookFiatRatesForTimestampsMock = jest.mocked(
    blockbookService.getFiatRatesForTimestamps,
);
const getCoingeckoFiatRatesForTimestampsMock = jest.mocked(
    coingeckoService.getFiatRatesForTimestamps,
);

describe(getFiatRatesForTimestamps.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getCoingeckoFiatRatesForTimestampsMock.mockResolvedValue(null);
    });

    it('fills unavailable Blockbook rates from CoinGecko', async () => {
        const timestamps = [1575288000, 1780987510];

        getFiatRatesForTimestampsMock.mockResolvedValue({
            success: true,
            payload: {
                tickers: [
                    {
                        ts: 1575288000,
                        rates: { usd: -1 },
                    },
                    {
                        ts: 1780986661,
                        rates: { usd: 0.324998 },
                    },
                ],
            },
        });
        getCoingeckoFiatRatesForTimestampsMock.mockResolvedValue({
            symbol: 'eth',
            ts: Date.now(),
            tickers: [
                {
                    ts: 1575288000,
                    rates: { usd: 0.15 },
                },
            ],
        });

        const result = await getFiatRatesForTimestamps({ symbol: 'eth' }, timestamps, 'usd', false);

        expect(getCoingeckoFiatRatesForTimestampsMock).toHaveBeenCalledWith(
            { symbol: 'eth' },
            [1575288000],
            'usd',
        );
        expect(result).toMatchObject({
            symbol: 'eth',
            tickers: [
                {
                    ts: 1575288000,
                    rates: { usd: 0.15 },
                },
                {
                    ts: 1780987510,
                    rates: { usd: 0.324998 },
                },
            ],
        });
    });

    it('replaces Blockbook rates returned for a different UTC day with CoinGecko rates', async () => {
        const timestamps = [1746057600, 1746144000];

        getFiatRatesForTimestampsMock.mockResolvedValue({
            success: true,
            payload: {
                tickers: [
                    {
                        ts: 1746144000,
                        rates: { usd: 0.25 },
                    },
                    {
                        ts: 1746147600,
                        rates: { usd: 0.26 },
                    },
                ],
            },
        });
        getCoingeckoFiatRatesForTimestampsMock.mockResolvedValue({
            symbol: 'eth',
            ts: Date.now(),
            tickers: [
                {
                    ts: 1746057600,
                    rates: { usd: 0.24 },
                },
            ],
        });

        const result = await getFiatRatesForTimestamps({ symbol: 'eth' }, timestamps, 'usd', false);

        expect(result).toMatchObject({
            symbol: 'eth',
            tickers: [
                {
                    ts: 1746057600,
                    rates: { usd: 0.24 },
                },
                {
                    ts: 1746144000,
                    rates: { usd: 0.26 },
                },
            ],
        });
    });

    it('keeps a timestamp unavailable when CoinGecko has no fallback rate', async () => {
        const timestamps = [1575288000, 1780987510];

        getFiatRatesForTimestampsMock.mockResolvedValue({
            success: true,
            payload: {
                tickers: [
                    {
                        ts: 1575288000,
                        rates: { usd: -1 },
                    },
                    {
                        ts: 1780986661,
                        rates: { usd: 0.324998 },
                    },
                ],
            },
        });

        const result = await getFiatRatesForTimestamps({ symbol: 'eth' }, timestamps, 'usd', false);

        expect(result).toMatchObject({
            symbol: 'eth',
            tickers: [
                {
                    ts: 1780987510,
                    rates: { usd: 0.324998 },
                },
            ],
        });
    });

    it('fills unavailable rates returned by the direct Blockbook service', async () => {
        const timestamps = [1575288000, 1780987510];

        getBlockbookFiatRatesForTimestampsMock.mockResolvedValue({
            symbol: 'btc',
            ts: Date.now(),
            tickers: [
                {
                    ts: 1575288000,
                    rates: { usd: -1 },
                },
                {
                    ts: 1780987510,
                    rates: { usd: 0.324998 },
                },
            ],
        });
        getCoingeckoFiatRatesForTimestampsMock.mockResolvedValue({
            symbol: 'btc',
            ts: Date.now(),
            tickers: [
                {
                    ts: 1575288000,
                    rates: { usd: 0.15 },
                },
            ],
        });

        const result = await getFiatRatesForTimestamps({ symbol: 'btc' }, timestamps, 'usd', true);

        expect(result).toMatchObject({
            symbol: 'btc',
            tickers: [
                {
                    ts: 1575288000,
                    rates: { usd: 0.15 },
                },
                {
                    ts: 1780987510,
                    rates: { usd: 0.324998 },
                },
            ],
        });
    });
});
