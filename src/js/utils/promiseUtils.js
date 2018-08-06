/* @flow */


// import root from 'window-or-global';
// import Promise from 'es6-promise';

export async function resolveAfter<T>(msec: number, value: any = null): Promise<T> {
    return await new Promise((resolve) => {
        //root.setTimeout(resolve, msec, value);
        window.setTimeout(resolve, msec, value);
    });
}