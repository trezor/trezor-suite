/* global it:false, describe:false */

import assert from 'assert';

import utils from '../../src/build-tx/coinselect-lib/utils';

describe('coinselect utils', () => {
    it('uintOrNaN', () => {
        assert.deepEqual(utils.uintOrNaN(1), 1);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN('')), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN(Infinity)), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN(NaN)), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN('1')), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN('1.1')), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN(1.1)), true);
        assert.deepEqual(Number.isNaN(utils.uintOrNaN(-1)), true);
    });
});
