import { UINT256_MAX } from '@suite-common/suite-constants';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { buildApprove } from '../../../builder/evm/approve';

const SPENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
const SENDER = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';

describe('buildApprove', () => {
    it('encodes valid approve calldata', () => {
        const result = buildApprove(
            {
                spender: SPENDER,
                amount: asAmountSubunit(new BigNumber('1000000')),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae00000000000000000000000000000000000000000000000000000000000f4240',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('encodes unlimited approval calldata', () => {
        const result = buildApprove(
            {
                spender: SPENDER,
                amount: asAmountSubunit(new BigNumber(UINT256_MAX)),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eaeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for invalid spender address', () => {
        const result = buildApprove(
            {
                spender: 'invalid-address',
                amount: asAmountSubunit(new BigNumber('1000000')),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'INVALID_ADDRESS', path: 'spender', severity: 'error' },
        ]);
    });

    it('returns warning for zero amount', () => {
        const result = buildApprove(
            {
                spender: SPENDER,
                amount: asAmountSubunit(new BigNumber('0')),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae0000000000000000000000000000000000000000000000000000000000000000',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
            { code: 'ZERO_AMOUNT', path: 'amount', severity: 'warning' },
        ]);
    });
});
