import { buildAllowance } from '../../../builder/evm/allowance';
import { asEvmAddress } from '../../../types/evm';

const OWNER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const SPENDER = asEvmAddress('0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae');

describe('buildAllowance', () => {
    it('encodes valid allowance calldata', () => {
        const result = buildAllowance({ owner: OWNER, spender: SPENDER });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xdd62ed3e0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero address', () => {
        const result = buildAllowance({
            owner: '0x0000000000000000000000000000000000000000',
            spender: SPENDER,
        });

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'ZERO_ADDRESS', path: 'owner', severity: 'error' }]);
    });
});
