import { fetchFiatExchangeRate } from '../src/frankfurter';

jest.mock('../src/fetch', () => ({
    fetchUrl: jest.fn(),
}));

const mockedFetchUrl = jest.requireMock('../src/fetch').fetchUrl as jest.Mock;

describe('fetchFiatExchangeRate', () => {
    beforeEach(() => {
        mockedFetchUrl.mockReset();
    });

    it('returns 1 for matching currencies', async () => {
        await expect(
            fetchFiatExchangeRate({ baseCurrencyCode: 'usd', quoteCurrencyCode: 'usd' }),
        ).resolves.toBe(1);

        expect(mockedFetchUrl).not.toHaveBeenCalled();
    });

    it('fetches a frankfurter fiat exchange rate', async () => {
        mockedFetchUrl.mockResolvedValue({
            ok: true,
            json: () => ({
                base: 'USD',
                date: '2026-04-01',
                quote: 'CZK',
                rate: 23.45,
            }),
        });

        await expect(
            fetchFiatExchangeRate({ baseCurrencyCode: 'usd', quoteCurrencyCode: 'czk' }),
        ).resolves.toBe(23.45);

        expect(mockedFetchUrl).toHaveBeenCalledWith('https://api.frankfurter.dev/v2/rate/USD/CZK');
    });
});
