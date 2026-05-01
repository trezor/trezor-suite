import { Verifier } from '../../../../verifier';

const claimWithdrawRequestHex = '0x33986ffa';

describe('verifyClaimWithdrawRequest', () => {
    it('returns isValid true for matching selector', () => {
        expect(Verifier.evm.everstake.claimWithdrawRequest(claimWithdrawRequestHex, {})).toEqual({
            isValid: true,
            issues: [],
        });
    });

    it('returns SIGNATURE_MISMATCH for unrelated calldata', () => {
        expect(Verifier.evm.everstake.claimWithdrawRequest('0xdeadbeef', {})).toEqual({
            isValid: false,
            issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
        });
    });
});
