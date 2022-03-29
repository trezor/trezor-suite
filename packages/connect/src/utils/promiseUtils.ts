// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/promiseUtils.js

export const resolveAfter = (msec: number, value?: any) =>
    new Promise<any>(resolve => {
        setTimeout(resolve, msec, value);
    });
