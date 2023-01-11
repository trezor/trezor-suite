/**
 * Promise.all in sequence
 *
 * @param actions list of async actions to be processed
 * @returns Array of results from actions
 */

export const promiseAllSequence = async <
    Fn extends () => PromiseLike<any>,
    R = Awaited<ReturnType<Fn>>,
>(
    actions: Fn[],
) => {
    const results: R[] = [];
    await actions.reduce(
        (promise, fn) =>
            // 2. then call action, store result and repeat
            promise.then(fn).then(result => {
                results.push(result);
                return result;
            }),
        Promise.resolve(), // 1. Resolve initial promise
    );
    return results;
};
