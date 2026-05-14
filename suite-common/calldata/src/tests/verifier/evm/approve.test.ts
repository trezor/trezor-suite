import { BigNumber } from '@trezor/utils';

import { buildApprove } from '../../../builder/evm/approve';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const SPENDER = asEvmAddress('0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae');
const SENDER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const AMOUNT = 1000000n;

const approveHex = buildApprove(
    { spender: SPENDER, amount: new BigNumber(AMOUNT.toString()) },
    { sender: SENDER },
).data!;

describe('verifyApprove', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.erc20.approve(approveHex, { spender: SPENDER, amount: AMOUNT }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH on full mismatch', () => {
        expect(
            Verifier.evm.erc20.approve(approveHex, {
                spender: '0x0000000000000000000000000000000000000001',
                amount: AMOUNT,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'spender' }] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.erc20.approve(approveHex, { spender: SPENDER, amount: 999n }, ['spender']),
        ).toEqual({ isValid: true, issues: [] });
    });
});
