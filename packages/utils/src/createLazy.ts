import { type Deferred, createDeferred } from './createDeferred';

export const createLazy = <T, TArgs extends Array<any>>(
    initLazy: (...args: TArgs) => Promise<T>,
    disposeLazy?: (t: T) => void,
) => {
    let value: T | undefined;
    let valuePromise: Deferred<T> | undefined;
    const inFlightInits = new Set<Promise<void>>();

    const get = () => value;

    const getPending = () => valuePromise?.promise;

    const dispose = () => {
        const inFlight = [...inFlightInits];
        if (valuePromise) {
            valuePromise.reject(new Error('Disposed during initialization'));
            valuePromise = undefined;
        }
        if (value !== undefined) {
            disposeLazy?.(value);
            value = undefined;
        }

        // resolves once every in-flight init has settled and its value been disposed
        return Promise.all(inFlight).then(() => {});
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
                        disposeLazy?.(val);

                        return;
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
