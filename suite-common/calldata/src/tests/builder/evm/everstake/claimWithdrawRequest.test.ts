import { buildClaimWithdrawRequest } from '../../../../builder/evm/everstake/claimWithdrawRequest';

describe('buildClaimWithdrawRequest', () => {
    it('encodes claimWithdrawRequest selector with no args', () => {
        const result = buildClaimWithdrawRequest({});

        expect(result.isValid).toBe(true);
        expect(result.data).toBe('0x33986ffa');
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });
});
