/* global it:false, describe:false */

import assert from 'assert';
import bitcoin from 'bitcoinjs-lib-zcash';
import { buildTx } from '../src/build-tx';
import { Permutation } from '../src/build-tx/permutation';


import fixtures from './fixtures/build-tx.json';

// eslint-disable-next-line no-unused-vars
import accumulative from './coinselect-lib/accumulative';
// eslint-disable-next-line no-unused-vars
import bnb from './coinselect-lib/bnb';
// eslint-disable-next-line no-unused-vars
import errors from './coinselect-lib/index-errors';
// eslint-disable-next-line no-unused-vars
import index from './coinselect-lib/index';
// eslint-disable-next-line no-unused-vars
import split from './coinselect-lib/split';
// eslint-disable-next-line no-unused-vars
import utils from './coinselect-lib/utils';

describe('build tx', () => {
    fixtures.forEach(({ description, request, result: r }) => {
        const result = r;
        it(description, () => {
            request.network = bitcoin.networks.bitcoin;
            if (result.transaction) {
                result.transaction.inputs.forEach((oinput) => {
                    const input = oinput;
                    input.hash = reverseBuffer(Buffer.from(input.REV_hash, 'hex'));
                    delete input.REV_hash;
                });
                const o = result.transaction.PERM_outputs;
                const sorted = JSON.parse(JSON.stringify(o.sorted));
                sorted.forEach((ss) => {
                    const s = ss;
                    if (s.opReturnData != null) {
                        s.opReturnData = Buffer.from(s.opReturnData);
                    }
                });
                result.transaction.outputs = new Permutation(sorted, o.permutation);
                delete result.transaction.PERM_outputs;
            }
            assert.deepEqual(buildTx(request), result);
        });
    });
});

function reverseBuffer(src: Buffer): Buffer {
    const buffer = Buffer.alloc(src.length);
    for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
        buffer[i] = src[j];
        buffer[j] = src[i];
    }
    return buffer;
}
