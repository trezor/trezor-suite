import { buildWethDeposit } from '../../../builder/evm/weth/deposit';
import { Verifier } from '../../../verifier';

const depositHex = buildWethDeposit({}).data!;

describe('verify weth deposit', () => {
    it('returns isValid true for the deposit() selector', () => {
        expect(Verifier.evm.weth.deposit(depositHex, {})).toEqual({ isValid: true, issues: [] });
    });

    it('rejects an ERC-4626 deposit(uint256,address) call (different selector)', () => {
        // 0x6e553f65 = deposit(uint256,address); must NOT verify as the zero-arg WETH deposit().
        const erc4626DepositHex =
            '0x6e553f6500000000000000000000000000000000000000000000000000000000004c4b400000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';

        expect(Verifier.evm.weth.deposit(erc4626DepositHex, {})).toEqual({
            isValid: false,
            issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
        });
    });

    it('returns SIGNATURE_MISMATCH for unrelated calldata', () => {
        expect(Verifier.evm.weth.deposit('0xdeadbeef', {})).toEqual({
            isValid: false,
            issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
        });
    });
});
