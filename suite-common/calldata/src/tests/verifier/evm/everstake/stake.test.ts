import { BigNumber } from '@trezor/utils';

import { buildStake } from '../../../../builder/evm/everstake/stake';
import { Verifier } from '../../../../verifier';

const SOURCE = 1n;

const stakeHex = buildStake({ source: new BigNumber(SOURCE.toString()) }).data!;

describe('verifyStake', () => {
    it('returns isValid true on full match', () => {
        expect(Verifier.evm.everstake.stake(stakeHex, { source: SOURCE })).toEqual({
            isValid: true,
            issues: [],
        });
    });

    it('returns VALUE_MISMATCH when source differs', () => {
        expect(Verifier.evm.everstake.stake(stakeHex, { source: 999n })).toEqual({
            isValid: false,
            issues: [{ code: 'VALUE_MISMATCH', field: 'source' }],
        });
    });

    it('returns SIGNATURE_MISMATCH for unrelated calldata', () => {
        expect(Verifier.evm.everstake.stake('0xdeadbeef', { source: SOURCE })).toEqual({
            isValid: false,
            issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
        });
    });
});
