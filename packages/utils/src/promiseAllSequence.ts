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
    // For some reason, the previous implementation with promise chaining
    // (https://github.com/trezor/trezor-suite/blob/100015c45451ed50e2b0906d78de73c0fd2883d1/packages/utils/src/promiseAllSequence.ts)
    // was significantly slower in some cases, therefore simple for cycle is used instead
    for (let i = 0; i < actions.length; ++i) {
        const result = await actions[i]();
        results.push(result);
    }
    return results;
};
