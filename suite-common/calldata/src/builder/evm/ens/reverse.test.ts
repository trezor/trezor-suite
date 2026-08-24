import { BigNumber } from '@trezor/utils';

import { buildEnsReverse } from './reverse';

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('buildEnsReverse', () => {
    it('encodes an address and its ENSIP-19 coin type', () => {
        const result = buildEnsReverse({
            lookupAddress: VITALIK_ADDRESS,
            coinType: new BigNumber(60),
        });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x5d78a217' +
                '0000000000000000000000000000000000000000000000000000000000000040' +
                '000000000000000000000000000000000000000000000000000000000000003c' +
                '0000000000000000000000000000000000000000000000000000000000000014' +
                'd8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000',
        );
    });
});
