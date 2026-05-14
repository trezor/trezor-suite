import { BigNumber } from '@trezor/utils';

import { buildTransfer } from '../../../builder/evm/transfer';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const RECIPIENT = asEvmAddress('0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96');

describe('buildTransfer', () => {
    it('encodes valid transfer calldata', () => {
        const result = buildTransfer(
            {
                to: RECIPIENT,
                amount: new BigNumber('1000000'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xa9059cbb000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a9600000000000000000000000000000000000000000000000000000000000f4240',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });
});
