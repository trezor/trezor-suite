import { type Deferred, createDeferred } from './createDeferred';

export const createLazy = <T, TArgs extends Array<any>>(
    initLazy: (...args: TArgs) => Promise<T>,
    disposeLazy?: (t: T) => void | Promise<void>,
    onDisposeError?: (err: unknown) => void,
) => {
    let value: T | undefined;
    let valuePromise: Deferred<T> | undefined;
    const inFlightInits = new Set<Promise<void>>();
    const inFlightDisposals = new Set<Promise<void>>();

    // Never rejects or throws, so fire-and-forget `dispose()` callers cannot produce unhandled rejections.
    const safeDispose = (val: T) => {
        const disposal = (async () => {
            try {
                await disposeLazy?.(val);
            } catch (err) {
                try {
                    onDisposeError?.(err);
                } catch {
                    // the error reporter must not break disposal
                }
            }
        })().finally(() => {
            inFlightDisposals.delete(disposal);
        });

        inFlightDisposals.add(disposal);

        return disposal;
    };

    const get = () => value;

    const getPending = () => valuePromise?.promise;

    const dispose = () => {
        const pending = [...inFlightInits, ...inFlightDisposals];
        if (valuePromise) {
            valuePromise.reject(new Error('Disposed during initialization'));
            valuePromise = undefined;
        }
        if (value !== undefined) {
            const disposed = value;
            value = undefined;
            pending.push(safeDispose(disposed));
        }

        // resolves once every in-flight init and every in-flight disposal has settled
        return Promise.all(pending).then(() => {});
    };

    const getOrInit = (...args: TArgs) => {
        if (value !== undefined) return Promise.resolve(value);
        if (!valuePromise) {
            const deferred = createDeferred<T>();
            valuePromise = deferred;
            const initSettled = initLazy(...args)
                .then(val => {
                    // Disposal may have occurred while initializing, so nobody owns this value anymore.
                    if (valuePromise !== deferred) {
                        return safeDispose(val);
                    }
                    value = val;
                    valuePromise = undefined;
                    deferred.resolve(val);
                })
                .catch(err => {
                    if (valuePromise === deferred) valuePromise = undefined;
                    deferred.reject(err);
                })
                .then(() => {
                    inFlightInits.delete(initSettled);
                });

            inFlightInits.add(initSettled);
        }

        return valuePromise.promise;
    };

    return { get, getPending, getOrInit, dispose };
};
