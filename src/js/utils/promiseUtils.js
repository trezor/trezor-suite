/* @flow */
'use strict';

// import root from 'window-or-global';
// import Promise from 'es6-promise';

export async function resolveAfter(msec: number, value: any = null): Promise {
    return await new Promise((resolve) => {
        //root.setTimeout(resolve, msec, value);
        window.setTimeout(resolve, msec, value);
    });
}