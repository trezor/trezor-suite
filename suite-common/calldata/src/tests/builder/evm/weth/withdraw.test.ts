import { BigNumber } from '@trezor/utils';

import { buildWethWithdraw } from '../../../../builder/evm/weth/withdraw';
import { Calldata } from '../../../../calldata';

describe('buildWethWithdraw', () => {
    it('encodes valid withdraw calldata', () => {
        const result = buildWethWithdraw({ wad: new BigNumber('1000000000000000000') });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('decodes encoded calldata back to the wad amount', () => {
        const result = buildWethWithdraw({ wad: new BigNumber('1507906') });

        expect(result.data).not.toBe(null);
        expect(Calldata.evm.weth.withdraw.decode(result.data ?? undefined)).toEqual({
            wad: 1_507_906n,
        });
    });

    it('returns error for zero wad', () => {
        const result = buildWethWithdraw({ wad: new BigNumber('0') });

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'wad', severity: 'error' }]);
        expect(result.warnings).toEqual([]);
    });
});
