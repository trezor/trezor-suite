import { type Deferred, createDeferred } from '@trezor/utils';

// Cache for parallel requests
// It's used to prevent multiple requests for the same data
export class ParallelRequestsCache {
    private promises: Record<string, Deferred<unknown>> = {};

    async cache<T>(keys: (string | number | undefined)[], fn: () => Promise<T>): Promise<T> {
        const key = keys.join('-');
        if (this.promises[key]) {
            // Cache hit
            return this.promises[key].promise as Promise<T>;
        }

        this.promises[key] = createDeferred<unknown>();
        try {
            const res = await fn();
            this.promises[key].resolve(res);
            delete this.promises[key];

            return res;
        } catch (error) {
            this.promises[key].reject(error);
            delete this.promises[key];

            throw error;
        }
    }
}
