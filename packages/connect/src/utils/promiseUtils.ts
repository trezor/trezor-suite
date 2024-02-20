// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/promiseUtils.js

export const resolveAfter = (msec: number, value?: any) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const promise = new Promise<any>(resolve => {
        timeout = setTimeout(resolve, msec, value);
    });

    return { promise, timeout };
};
