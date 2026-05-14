import { buildAllowance } from '../../../builder/evm/allowance';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const OWNER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const SPENDER = asEvmAddress('0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae');

const allowanceHex = buildAllowance({ owner: OWNER, spender: SPENDER }).data!;

describe('verifyAllowance', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.erc20.allowance(allowanceHex, { owner: OWNER, spender: SPENDER }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH on mismatch', () => {
        expect(
            Verifier.evm.erc20.allowance(allowanceHex, {
                owner: '0x0000000000000000000000000000000000000001',
                spender: SPENDER,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'owner' }] });
    });
});
