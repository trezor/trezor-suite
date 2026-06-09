import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import {
    type TickerResult,
    type Timestamp,
    type TokenAddress,
    asTimestamp,
} from '@suite-common/wallet-types';

import {
    fetchTransactionsRates,
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from './fiatRatesUtils';

jest.mock('@suite-common/fiat-services', () => ({
    getFiatRatesForTimestamps: jest.fn(),
}));

const getFiatRatesForTimestampsMock = jest.mocked(getFiatRatesForTimestamps);

describe('fiat rates utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('formats fiat rate key', () => {
        expect(getFiatRateKey('eth', 'usd')).toMatch('eth-usd');

        const result = getFiatRateKey(
            'eth',
            'usd',
            '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
        );

        expect(result).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('formats fiat rate key from ticker', () => {
        expect(getFiatRateKeyFromTicker({ symbol: 'eth' }, 'usd')).toMatch('eth-usd');

        const result = getFiatRateKeyFromTicker(
            {
                symbol: 'eth',
                tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
            },
            'usd',
        );

        expect(result).toMatch('eth-0x6b175474e89094c44da98b954eedeac495271d0f-usd');
    });
    it('rounds timestamp to the nearest past hour', () => {
        const timestamp = new Date('2024-03-19T15:45:00Z').getTime() / 1000;
        const expected = new Date('2024-03-19T15:00:00Z').getTime() / 1000;

        expect(roundTimestampToNearestPastHour(timestamp as Timestamp)).toBe(expected);
    });

    it('maps fetched transaction rates by ticker timestamp', async () => {
        const rates: TickerResult[] = [];

        getFiatRatesForTimestampsMock.mockResolvedValue({
            symbol: 'eth',
            ts: Date.now(),
            tickers: [
                {
                    ts: 7200,
                    rates: { usd: 2 },
                },
            ],
        });

        await fetchTransactionsRates(
            { symbol: 'eth' },
            [asTimestamp(3600), asTimestamp(7200)],
            'usd',
            false,
            rates,
        );

        expect(rates).toEqual([
            {
                tickerId: { symbol: 'eth' },
                localCurrency: 'usd',
                rates: [
                    {
                        rate: 2,
                        lastTickerTimestamp: 7200,
                    },
                ],
            },
        ]);
    });
});
