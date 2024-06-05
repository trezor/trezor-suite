import { Deferred, createDeferred } from '@trezor/utils';

// Cache for parallel requests
// It's used to prevent multiple requests for the same data
export class ParallelRequestsCache {
    private promises: Record<string, Deferred<any>> = {};

    async cache<T>(keys: (string | number | undefined)[], fn: () => Promise<T>): Promise<T> {
        const key = keys.join('-');
        if (this.promises[key]) {
            // Cache hit
            return this.promises[key].promise;
        }

        this.promises[key] = createDeferred();
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
