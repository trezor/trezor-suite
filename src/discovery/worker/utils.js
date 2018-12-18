/* @flow */
import type { Input as BitcoinJsInput } from 'bitcoinjs-lib-zcash';

export function getInputId(
    i: BitcoinJsInput,
): string {
    const { hash } = i;
    Array.prototype.reverse.call(hash);
    const res = (hash.toString('hex'));
    Array.prototype.reverse.call(hash);
    return res;
}

export function objectValues<T>(k: {[k: any]: T}): Array<T> {
    return Object.keys(k).map(key => k[key]);
}

export function filterNull<T>(k: Array<?T>, throwErrorOnNull: boolean): Array<T> {
    const res: Array<T> = [];
    k.forEach((t) => {
        if (t != null) {
            res.push(t);
        } else if (throwErrorOnNull) {
            throw new Error('Unexpected null');
        }
    });
    return res;
}
