import * as ecc from '@bitcoinerlab/secp256k1';
import { Buffer } from 'buffer';

const adapter =
    fn =>
    (...args) => {
        const result = fn(...args);
        // @trezor/utxo-lib strictly requires Buffer to be used
        if (result instanceof Uint8Array && !(result instanceof Buffer)) {
            return Buffer.from(result);
        }

        return result;
    };

const shimmedEcc = {};
Object.keys(ecc).forEach(key => {
    const value = ecc[key];
    shimmedEcc[key] = typeof value === 'function' ? adapter(value) : value;
});

// eslint-disable-next-line import/no-default-export
export default shimmedEcc;
