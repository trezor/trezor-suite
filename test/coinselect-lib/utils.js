/* global it:false, describe:false */

import assert from 'assert';

import utils from '../../lib/build-tx/coinselect-lib/utils';

describe('coinselect utils', () => {
    it('uintOrNaN', () => {
        assert.deepEqual(utils.uintOrNaN(1), 1);
        assert.deepEqual(isNaN(utils.uintOrNaN('')), true);
        assert.deepEqual(isNaN(utils.uintOrNaN(Infinity)), true);
        assert.deepEqual(isNaN(utils.uintOrNaN(NaN)), true);
        assert.deepEqual(isNaN(utils.uintOrNaN('1')), true);
        assert.deepEqual(isNaN(utils.uintOrNaN('1.1')), true);
        assert.deepEqual(isNaN(utils.uintOrNaN(1.1)), true);
        assert.deepEqual(isNaN(utils.uintOrNaN(-1)), true);
    });
});
