/**
 * Cache class which allows to store Key-Value pairs with a TTL for each key
 */
export class Cache {
    store: Map<string, { value: any; ttl: number }>;

    constructor() {
        this.store = new Map();
    }

    set(key: string, value: any, ttl: number) {
        this.store.set(key, { value, ttl: Date.now() + ttl });
    }

    get(key: string) {
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
