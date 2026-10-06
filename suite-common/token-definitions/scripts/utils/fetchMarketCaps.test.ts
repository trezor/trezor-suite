import { MARKET_CAPS_IDS_PER_REQUEST } from '../constants';

type MarketRow = { id: string; market_cap: number | null };

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

// The API clients capture `globalThis.fetch` when the module under test is first evaluated, so the
// mock above has to be installed before that happens — hence the require instead of a top-level
// import, which would be hoisted above the assignment.
const { fetchMarketCaps } = require('./fetchMarketCaps') as typeof import('./fetchMarketCaps');

const jsonResponse = (rows: MarketRow[]) =>
    new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

// up-fetch hands `fetch` a Request instance rather than a URL string.
const requestedUrls = () =>
    fetchMock.mock.calls.map(([request]) => new URL(String((request as Request).url)));

const requestedIds = (index: number) =>
    requestedUrls()[index]?.searchParams.get('ids')?.split(',') ?? [];

describe(fetchMarketCaps.name, () => {
    beforeAll(() => {
        process.env.COINGECKO_API_KEY = 'test-key';
    });

    beforeEach(() => {
        fetchMock.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('should map every coin id to its market cap', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse([
                { id: 'bitcoin', market_cap: 42 },
                { id: 'ethereum', market_cap: 7 },
            ]),
        );

        const marketCaps = await fetchMarketCaps(['bitcoin', 'ethereum']);

        expect(marketCaps.get('bitcoin')).toBe(42);
        expect(marketCaps.get('ethereum')).toBe(7);
        expect(marketCaps.size).toBe(2);
    });

    it('should ask for the coins by id rather than paging the whole market list', async () => {
        fetchMock.mockResolvedValue(jsonResponse([{ id: 'bitcoin', market_cap: 42 }]));

        await fetchMarketCaps(['bitcoin']);

        const [url] = requestedUrls();
        expect(url?.searchParams.get('ids')).toBe('bitcoin');
        expect(url?.searchParams.get('vs_currency')).toBe('usd');
    });

    it('should split the coins into batches the endpoint accepts', async () => {
        const coinIds = Array.from(
            { length: MARKET_CAPS_IDS_PER_REQUEST + 1 },
            (_, index) => `coin-${index}`,
        );
        fetchMock.mockResolvedValue(jsonResponse([]));

        await fetchMarketCaps(coinIds);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(requestedIds(0)).toHaveLength(MARKET_CAPS_IDS_PER_REQUEST);
        expect(requestedIds(1)).toEqual([`coin-${MARKET_CAPS_IDS_PER_REQUEST}`]);
    });

    it('should leave out a coin CoinGecko reports no market cap for', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse([
                { id: 'bitcoin', market_cap: 42 },
                { id: 'obscure-coin', market_cap: null },
            ]),
        );

        const marketCaps = await fetchMarketCaps(['bitcoin', 'obscure-coin']);

        expect(marketCaps.has('obscure-coin')).toBe(false);
        expect(marketCaps.size).toBe(1);
    });

    it('should leave out a coin the response omits entirely', async () => {
        fetchMock.mockResolvedValue(jsonResponse([{ id: 'bitcoin', market_cap: 42 }]));

        const marketCaps = await fetchMarketCaps(['bitcoin', 'never-returned']);

        expect(marketCaps.has('never-returned')).toBe(false);
    });

    // A failed request must never look like "this coin has no market cap", which would rank the
    // token at the bottom of the list as if that were a fact.
    it('should throw rather than return a partial map when a request keeps failing', async () => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        fetchMock.mockResolvedValue(new Response('Too Many Requests', { status: 429 }));

        const settled = fetchMarketCaps(['bitcoin']).catch((error: unknown) => error);
        await jest.runAllTimersAsync();

        expect(await settled).toBeInstanceOf(Error);
    });

    it('should wait as long as a rate limited response asks before retrying', async () => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        fetchMock
            .mockResolvedValueOnce(
                new Response('Too Many Requests', { status: 429, headers: { 'retry-after': '5' } }),
            )
            .mockResolvedValueOnce(jsonResponse([{ id: 'bitcoin', market_cap: 42 }]));

        const marketCaps = fetchMarketCaps(['bitcoin']);

        await jest.advanceTimersByTimeAsync(4_000);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(2_000);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        expect((await marketCaps).get('bitcoin')).toBe(42);
    });

    it('should throw when the API key is missing, before any request is made', async () => {
        delete process.env.COINGECKO_API_KEY;

        await expect(fetchMarketCaps(['bitcoin'])).rejects.toThrow('COINGECKO_API_KEY');
        expect(fetchMock).not.toHaveBeenCalled();

        process.env.COINGECKO_API_KEY = 'test-key';
    });
});
