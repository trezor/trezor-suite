import { getFiatRatesForTimestamps } from './blockbook';
import { fetchUrl } from './fetch';

jest.mock('../src/fetch', () => ({
    fetchUrl: jest.fn(),
}));

const fetchUrlMock = jest.mocked(fetchUrl);

describe(getFiatRatesForTimestamps.name, () => {
    it('preserves timestamps returned by Blockbook', async () => {
        fetchUrlMock.mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        ts: 1746144000,
                        rates: { usd: 0.25 },
                    },
                ]),
            ),
        );

        const result = await getFiatRatesForTimestamps('btc', [1746057600], 'usd');

        expect(result?.tickers).toEqual([
            {
                ts: 1746144000,
                rates: { usd: 0.25 },
            },
        ]);
    });
});
