/* global it:false, describe:false */

import assert from 'assert';

import { uintOrNaN } from '../../src/build-tx/coinselect-lib/utils';

describe('coinselect utils', () => {
    it('uintOrNaN', () => {
        assert.deepEqual(uintOrNaN(1), 1);
        assert.deepEqual(Number.isNaN(uintOrNaN('')), true);
        assert.deepEqual(Number.isNaN(uintOrNaN(Infinity)), true);
        assert.deepEqual(Number.isNaN(uintOrNaN(NaN)), true);
        assert.deepEqual(Number.isNaN(uintOrNaN('1')), true);
        assert.deepEqual(Number.isNaN(uintOrNaN('1.1')), true);
        assert.deepEqual(Number.isNaN(uintOrNaN(1.1)), true);
        assert.deepEqual(Number.isNaN(uintOrNaN(-1)), true);
    });
});
