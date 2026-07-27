import { BigNumber } from '@trezor/utils';

import { buildWethWithdraw } from '../../../../builder/evm/weth/withdraw';
import { Verifier } from '../../../../verifier';

const WAD = 1_000_000_000_000_000_000n;
const withdrawHex = buildWethWithdraw({ wad: new BigNumber(WAD.toString()) }).data!;

describe('verify weth withdraw', () => {
    it('returns isValid true on matching wad', () => {
        expect(Verifier.evm.weth.withdraw(withdrawHex, { wad: WAD })).toEqual({
            isValid: true,
            issues: [],
        });
    });

    it('returns VALUE_MISMATCH on a different wad', () => {
        expect(Verifier.evm.weth.withdraw(withdrawHex, { wad: 1n })).toEqual({
            isValid: false,
            issues: [{ code: 'VALUE_MISMATCH', field: 'wad' }],
        });
    });

    it('returns SIGNATURE_MISMATCH for unrelated calldata', () => {
        expect(Verifier.evm.weth.withdraw('0xdeadbeef', { wad: WAD })).toEqual({
            isValid: false,
            issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
        });
    });
});
