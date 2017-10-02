/* global it:false, describe:false */

import assert from 'assert';
import {buildTx} from '../lib/build-tx';
import {Permutation} from '../lib/build-tx/permutation';

import bitcoin from 'bitcoinjs-lib-zcash';

import fixtures from './fixtures/build-tx.json';

describe('build tx', () => {
    fixtures.forEach(({description, request, result}) => {
        it(description, () => {
            request.network = bitcoin.networks.bitcoin;
            if (result.transaction) {
                result.transaction.inputs.forEach(input => {
                    input.hash = reverseBuffer(new Buffer(input.REV_hash, 'hex'));
                    delete input.REV_hash;
                });
                const o = result.transaction.PERM_outputs;
                result.transaction.outputs = new Permutation(o.sorted, o.permutation);
                delete result.transaction.PERM_outputs;
            }
            assert.deepEqual(buildTx(request), result);
        });
    });
});

function reverseBuffer(src: Buffer): Buffer {
    const buffer = new Buffer(src.length);
    for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
        buffer[i] = src[j];
        buffer[j] = src[i];
    }
    return buffer;
}

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

