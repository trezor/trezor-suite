import {
    DeferredStaleWhileRevalidate,
    type RevalidatingStrategyHandler,
} from './DeferredStaleWhileRevalidate';

// Serwist ships ES modules only, which unit tests do not load; the strategy uses nothing of the base class.
jest.mock('serwist', () => ({ Strategy: class {} }));

const REVALIDATION_DELAY_MS = 10_000;
const FILE_URL =
    'https://data.trezor.io/suite/definitions/stable/ethereum.simple.coin.definitions.v1.json';

class TestedStrategy extends DeferredStaleWhileRevalidate {
    respondTo(request: Request, handler: RevalidatingStrategyHandler) {
        return this._handle(request, handler);
    }
}

const createStrategy = () => new TestedStrategy({ revalidationDelayMs: REVALIDATION_DELAY_MS });

type MockStrategyHandlerParams = {
    cachedResponse?: Response;
    fetchAndCachePut?: () => Promise<Response>;
    cachePut?: () => Promise<boolean>;
};

const mockStrategyHandler = ({
    cachedResponse,
    fetchAndCachePut = () => Promise.resolve(new Response('fetched')),
    cachePut = () => Promise.resolve(true),
}: MockStrategyHandlerParams) => {
    const lifetimePromises: Promise<unknown>[] = [];
    const handler = {
        cacheMatch: jest.fn(() => Promise.resolve(cachedResponse)),
        cachePut: jest.fn(cachePut),
        fetchAndCachePut: jest.fn(fetchAndCachePut),
        waitUntil: <T>(promise: Promise<T>) => {
            lifetimePromises.push(promise);

            return promise;
        },
    } satisfies RevalidatingStrategyHandler;

    return { handler, lifetimePromises };
};

const mockFetch = (implementation: typeof fetch) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(implementation);

const fetchUntilAborted: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
        );
    });

describe('DeferredStaleWhileRevalidate', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('fetches a file missing from the cache at once', async () => {
        const fetchedResponse = new Response('fetched');
        const { handler, lifetimePromises } = mockStrategyHandler({
            fetchAndCachePut: () => Promise.resolve(fetchedResponse),
        });
        const request = new Request(FILE_URL);

        await expect(createStrategy().respondTo(request, handler)).resolves.toBe(fetchedResponse);

        expect(handler.fetchAndCachePut).toHaveBeenCalledWith(request);
        expect(lifetimePromises).toHaveLength(0);
    });

    it('serves the cached file and updates it after the delay, at a low priority', async () => {
        const cachedResponse = new Response('cached');
        const updatedResponse = new Response('updated');
        const fetchSpy = mockFetch(() => Promise.resolve(updatedResponse));
        const { handler, lifetimePromises } = mockStrategyHandler({ cachedResponse });
        const request = new Request(FILE_URL);

        await expect(createStrategy().respondTo(request, handler)).resolves.toBe(cachedResponse);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS - 1);

        expect(fetchSpy).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            FILE_URL,
            expect.objectContaining({ priority: 'low' }),
        );
        expect(handler.cachePut).toHaveBeenCalledWith(request, updatedResponse);
        // The worker stays alive until the update ends.
        expect(lifetimePromises).toHaveLength(1);
        await expect(lifetimePromises[0]).resolves.toBeUndefined();
    });

    it('updates a file once while its update is pending, whichever tab asks', async () => {
        const fetchSpy = mockFetch(() => Promise.resolve(new Response('updated')));
        const strategy = createStrategy();
        const firstTab = mockStrategyHandler({ cachedResponse: new Response('cached') });
        const secondTab = mockStrategyHandler({ cachedResponse: new Response('cached') });

        await strategy.respondTo(new Request(FILE_URL), firstTab.handler);
        await strategy.respondTo(new Request(FILE_URL), secondTab.handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(secondTab.lifetimePromises).toHaveLength(0);

        // Once the update has ended, the next request schedules another.
        await strategy.respondTo(new Request(FILE_URL), secondTab.handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(secondTab.handler.cachePut).toHaveBeenCalledTimes(1);
    });

    it('keeps the cached file when the update fails and tries again on the next request', async () => {
        const fetchSpy = mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
        const strategy = createStrategy();
        const { handler, lifetimePromises } = mockStrategyHandler({
            cachedResponse: new Response('cached'),
        });

        await strategy.respondTo(new Request(FILE_URL), handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);
        await expect(lifetimePromises[0]).resolves.toBeUndefined();

        await strategy.respondTo(new Request(FILE_URL), handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(handler.cachePut).not.toHaveBeenCalled();
    });

    it('drops the updates still waiting when cancelled, and schedules none after', async () => {
        const fetchSpy = mockFetch(() => Promise.resolve(new Response('updated')));
        const strategy = createStrategy();
        const { handler, lifetimePromises } = mockStrategyHandler({
            cachedResponse: new Response('cached'),
        });

        await strategy.respondTo(new Request(FILE_URL), handler);
        await strategy.cancelRevalidations();
        await expect(lifetimePromises[0]).resolves.toBeUndefined();

        await strategy.respondTo(new Request(FILE_URL), handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(handler.cachePut).not.toHaveBeenCalled();
    });

    it('aborts an update that is fetching when cancelled, and stores nothing', async () => {
        const fetchSpy = mockFetch(fetchUntilAborted);
        const strategy = createStrategy();
        const { handler } = mockStrategyHandler({ cachedResponse: new Response('cached') });

        await strategy.respondTo(new Request(FILE_URL), handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(fetchSpy).toHaveBeenCalledTimes(1);

        await strategy.cancelRevalidations();

        expect(handler.cachePut).not.toHaveBeenCalled();
    });

    it('lets an update that is storing its file finish before the cancellation resolves', async () => {
        mockFetch(() => Promise.resolve(new Response('updated')));
        let finishStoring = () => {};
        const strategy = createStrategy();
        const { handler } = mockStrategyHandler({
            cachedResponse: new Response('cached'),
            cachePut: () =>
                new Promise(resolve => {
                    finishStoring = () => resolve(true);
                }),
        });

        await strategy.respondTo(new Request(FILE_URL), handler);
        await jest.advanceTimersByTimeAsync(REVALIDATION_DELAY_MS);

        expect(handler.cachePut).toHaveBeenCalledTimes(1);

        let isCancelled = false;
        const cancellation = strategy.cancelRevalidations().then(() => {
            isCancelled = true;
        });
        await jest.advanceTimersByTimeAsync(0);

        expect(isCancelled).toBe(false);

        finishStoring();
        await cancellation;

        expect(isCancelled).toBe(true);
    });
});
