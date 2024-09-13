type PromiseFn<T> = (prev: T) => Promise<T>;

/**
 * Allows to create promise which can be awaited at one place and gradually
 * concatenated by more promises from another places, combining results from
 * previous and consequent promises.
 */
export const createExtendablePromise = <T>() => {
    let promiseFn: PromiseFn<T> | undefined;

    /**
     * Adds a promise which will run after potential, already added promises, process their return
     * value (or initial value if this is the first one) and returns a new value.
     *
     * @param fn Function which receives return value from previous promises and returns promise
     * which will process this value and return a new one.
     */
    const extend = (fn: PromiseFn<T>) => {
        const oldFn = promiseFn ?? ((prev: T) => Promise.resolve(prev));
        promiseFn = (t: T) => oldFn(t).then(fn);
    };

    /**
     * Waits until all promises added since the last wait or during this wait are resolved, and returns
     * combined return value of all of them, starting from the initial value.
     *
     * @param initialValue Initial value. If there isn't any added promise, it's immediately returned.
     */
    const wait = async (initialValue: T) => {
        let result = initialValue;
        while (promiseFn) {
            const fn = promiseFn;
            promiseFn = undefined;
            result = await fn(result);
        }

        return result;
    };

    /**
     * Resets currently added promises
     */
    const dispose = () => {
        promiseFn = undefined;
    };

    return { extend, wait, dispose };
};
