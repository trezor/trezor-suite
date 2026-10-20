import { checksumAddress, toFunctionSelector } from 'viem';

import { MULTICALL3_ADDRESS, MULTICALL3_AGGREGATE3_ABI } from './multicall3';

describe('MULTICALL3', () => {
    it('uses the canonical checksummed deployment address', () => {
        expect(MULTICALL3_ADDRESS).toBe(checksumAddress(MULTICALL3_ADDRESS));
    });

    it('describes aggregate3', () => {
        expect(toFunctionSelector(MULTICALL3_AGGREGATE3_ABI[0])).toBe('0x82ad56cb');
    });
});
