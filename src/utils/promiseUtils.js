/* @flow */

export const resolveAfter = (msec: number, value?: any): Promise<any> => new Promise((resolve) => {
    window.setTimeout(resolve, msec, value);
});
