import { Deferred, createDeferred } from './createDeferred';

export const createLazy = <T, TArgs extends Array<any>>(
    initLazy: (...args: TArgs) => Promise<T>,
    disposeLazy?: (t: T) => void,
) => {
    let value: T | undefined;
    let valuePromise: Deferred<T> | undefined;

    const get = () => value;

    const getPending = () => valuePromise?.promise;

    const dispose = () => {
        if (valuePromise) {
            valuePromise.reject(new Error('Disposed during initialization'));
            valuePromise = undefined;
        }
        if (value !== undefined) {
            disposeLazy?.(value);
            value = undefined;
        }
    };

    const getOrInit = (...args: TArgs) => {
        if (value !== undefined) return Promise.resolve(value);
        if (!valuePromise) {
            const deferred = createDeferred<T>();
            valuePromise = deferred;
            initLazy(...args)
                .then(val => {
                    value = val;
                    valuePromise = undefined;
                    deferred.resolve(val);
                })
                .catch(err => {
                    valuePromise = undefined;
                    deferred.reject(err);
                });
        }

        return valuePromise.promise;
    };

    return { get, getPending, getOrInit, dispose };
};
