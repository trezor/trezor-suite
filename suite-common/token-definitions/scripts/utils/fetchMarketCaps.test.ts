import {
    MARKET_CAPS_MAX_ATTEMPTS,
    MARKET_CAPS_MAX_PAGES,
    MARKET_CAPS_PER_PAGE,
} from '../constants';
import { fetchMarketCaps } from './fetchMarketCaps';

type MarketPageItem = {
    id: string;
    market_cap: number | null;
};

const jsonResponse = (page: MarketPageItem[]) =>
    new Response(JSON.stringify(page), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

const buildFullPage = (pageIndex: number): MarketPageItem[] =>
    Array.from({ length: MARKET_CAPS_PER_PAGE }, (_, index) => {
        const coinIndex = pageIndex * MARKET_CAPS_PER_PAGE + index;

        return { id: `coin-${coinIndex}`, market_cap: 1_000_000 - coinIndex };
    });

const mockPages = (pages: MarketPageItem[][]) => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    pages.forEach(page => {
        fetchSpy.mockResolvedValueOnce(jsonResponse(page));
    });

    return fetchSpy;
};

const silenceWarnings = () => jest.spyOn(console, 'warn').mockImplementation(() => undefined);

describe('fetchMarketCaps', () => {
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('should map every coin id to its market cap', async () => {
        mockPages([
            [
                { id: 'bitcoin', market_cap: 42 },
                { id: 'ethereum', market_cap: 7 },
            ],
        ]);

        const marketCaps = await fetchMarketCaps();

        expect(marketCaps.get('bitcoin')).toBe(42);
        expect(marketCaps.get('ethereum')).toBe(7);
        expect(marketCaps.size).toBe(2);
    });

    it('should keep paging while pages come back full and stop on the first partial page', async () => {
        const fetchSpy = mockPages([
            buildFullPage(0),
            buildFullPage(1),
            [{ id: 'last-coin', market_cap: 1 }],
        ]);

        const marketCaps = await fetchMarketCaps();

        expect(fetchSpy).toHaveBeenCalledTimes(3);
        expect(marketCaps.size).toBe(2 * MARKET_CAPS_PER_PAGE + 1);
        expect(marketCaps.get('last-coin')).toBe(1);

        const requestedPages = fetchSpy.mock.calls.map(([url]) =>
            new URL(url as string).searchParams.get('page'),
        );
        expect(requestedPages).toEqual(['1', '2', '3']);
    });

    it('should page in a stable order, so that a coin cannot be skipped by a live rerank', async () => {
        const fetchSpy = mockPages([[{ id: 'bitcoin', market_cap: 42 }]]);

        await fetchMarketCaps();

        const requestedOrders = fetchSpy.mock.calls.map(([url]) =>
            new URL(url as string).searchParams.get('order'),
        );
        expect(requestedOrders).toEqual(['id_asc']);
    });

    it('should skip coins without a market cap', async () => {
        mockPages([
            [
                { id: 'bitcoin', market_cap: 42 },
                { id: 'obscure-coin', market_cap: null },
            ],
        ]);

        const marketCaps = await fetchMarketCaps();

        expect(marketCaps.has('obscure-coin')).toBe(false);
        expect(marketCaps.size).toBe(1);
    });

    it('should retry a rate limited page and keep its result', async () => {
        jest.useFakeTimers();
        silenceWarnings();
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }))
            .mockResolvedValueOnce(jsonResponse([{ id: 'bitcoin', market_cap: 42 }]));

        const marketCapsPromise = fetchMarketCaps();
        await jest.runAllTimersAsync();
        const marketCaps = await marketCapsPromise;

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(marketCaps.get('bitcoin')).toBe(42);
    });

    it('should throw once the retries for a page are exhausted', async () => {
        jest.useFakeTimers();
        silenceWarnings();
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockImplementation(() =>
                Promise.resolve(new Response('Too Many Requests', { status: 429 })),
            );

        // The rejection is captured up front, so that it stays handled while the retry delays
        // are flushed by the fake timers.
        const settledPromise = fetchMarketCaps().catch((error: unknown) => error);
        await jest.runAllTimersAsync();
        const error = await settledPromise;

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(`after ${MARKET_CAPS_MAX_ATTEMPTS} attempts`);
        expect(fetchSpy).toHaveBeenCalledTimes(MARKET_CAPS_MAX_ATTEMPTS);
    });

    it('should throw without retrying when CoinGecko rejects the request', async () => {
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockResolvedValue(new Response('Unauthorized', { status: 401 }));

        await expect(fetchMarketCaps()).rejects.toThrow('401');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw rather than return a partial list when the page cap is reached', async () => {
        const fullPage = JSON.stringify(buildFullPage(0));
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve(
                new Response(fullPage, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );

        await expect(fetchMarketCaps()).rejects.toThrow(`${MARKET_CAPS_MAX_PAGES} pages`);
        expect(fetchSpy).toHaveBeenCalledTimes(MARKET_CAPS_MAX_PAGES);
    });
});
