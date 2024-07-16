// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/promiseUtils.js

import { createDeferred } from '@trezor/utils';

export const resolveAfter = <T = void>(msec: number, value?: T) => {
    const { promise, reject, resolve } = createDeferred<T>();
    const timeout = setTimeout(resolve, msec, value);

    return {
        promise: promise.finally(() => clearTimeout(timeout)),
        reject,
    };
};
