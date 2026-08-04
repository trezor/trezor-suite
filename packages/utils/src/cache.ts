/**
 * Cache class which allows to store Key-Value pairs with a TTL for each key
 */
export class Cache<T = unknown> {
    store: Map<string, { value: T; ttl: number }>;

    constructor() {
        this.store = new Map();
    }

    set(key: string, value: T, ttl: number) {
        this.store.set(key, { value, ttl: Date.now() + ttl });
    }

    get(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return;
        if (entry.ttl < Date.now()) {
            this.store.delete(key);

            return;
        }

        return entry.value;
    }

    delete(key: string) {
        this.store.delete(key);
    }
}
