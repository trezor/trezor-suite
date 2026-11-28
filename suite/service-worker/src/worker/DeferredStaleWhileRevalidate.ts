import { Strategy, type StrategyHandler, type StrategyOptions } from 'serwist';

export type DeferredStaleWhileRevalidateOptions = StrategyOptions & {
    revalidationDelayMs: number;
};

/** What the strategy uses of the handler Serwist creates for each request. */
export type RevalidatingStrategyHandler = Pick<
    StrategyHandler,
    'cacheMatch' | 'cachePut' | 'fetchAndCachePut' | 'waitUntil'
>;

const waitUnlessAborted = (milliseconds: number, signal: AbortSignal) =>
    new Promise<void>(resolve => {
        if (signal.aborted) {
            resolve();

            return;
        }
        const timeout = setTimeout(resolve, milliseconds);
        signal.addEventListener(
            'abort',
            () => {
                clearTimeout(timeout);
                resolve();
            },
            { once: true },
        );
    });

/**
 * Stale-while-revalidate that updates a cached file only a while after serving it, at a low priority,
 * so that the update stays out of the requests the app starts with.
 * The app is not held up either way: it gets the cached file now, and the update serves the next request.
 * A file missing from the cache is fetched at once.
 * While a file's update is pending, further requests for it, from any tab, schedule no other one.
 */
export class DeferredStaleWhileRevalidate extends Strategy {
    private readonly revalidationDelayMs: number;
    private readonly pendingRevalidations = new Map<string, Promise<void>>();
    private readonly revalidationController = new AbortController();

    constructor({ revalidationDelayMs, ...options }: DeferredStaleWhileRevalidateOptions) {
        super(options);
        this.revalidationDelayMs = revalidationDelayMs;
    }

    /**
     * Stops the pending updates for good and waits for any that is storing its file,
     * so that none writes to a cache an uninstall is about to delete.
     */
    async cancelRevalidations() {
        this.revalidationController.abort();
        await Promise.all(this.pendingRevalidations.values());
    }

    protected async _handle(request: Request, handler: RevalidatingStrategyHandler) {
        const cachedResponse = await handler.cacheMatch(request);

        if (!cachedResponse) {
            return handler.fetchAndCachePut(request);
        }

        if (!this.pendingRevalidations.has(request.url)) {
            const revalidation = this.revalidate(request, handler);
            this.pendingRevalidations.set(request.url, revalidation);
            // The request's event lasts until the update ends, which keeps the worker running meanwhile.
            void handler.waitUntil(revalidation);
        }

        return cachedResponse;
    }

    private async revalidate(request: Request, handler: RevalidatingStrategyHandler) {
        const { signal } = this.revalidationController;

        try {
            await waitUnlessAborted(this.revalidationDelayMs, signal);
            if (signal.aborted) return;

            // Chrome keeps the priority a page's request was sent with, so the update is a new request.
            const response = await fetch(request.url, {
                ...this.fetchOptions,
                priority: 'low',
                signal,
            });
            if (!signal.aborted) {
                await handler.cachePut(request, response);
            }
        } catch {
            // Offline, for one: the cached file stays until a later update.
        } finally {
            this.pendingRevalidations.delete(request.url);
        }
    }
}
