// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/lazy.ts

export function prop(object: Record<string, any>, name: string, f: () => any) {
    Object.defineProperty(object, name, {
        configurable: true,
        enumerable: true,
        get() {
            const value = f.call(this);
            this[name] = value;
            return value;
        },
        set<V>(value: V) {
            Object.defineProperty(this, name, {
                configurable: true,
                enumerable: true,
                value,
                writable: true,
            });
        },
    });
}

export function value<T>(f: () => T): () => T {
    let value: T;
    return (): T => {
        if (value !== undefined) return value;
        value = f();
        return value;
    };
}
