import { BigNumber } from '@trezor/utils';

import { buildStake } from '../../../../builder/evm/everstake/stake';

describe('buildStake', () => {
    it('encodes valid stake calldata for source = 1', () => {
        const result = buildStake({ source: new BigNumber(1) });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error when source overflows uint64', () => {
        const result = buildStake({ source: new BigNumber('0x10000000000000000') });

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'EXCEEDS_UINT64', path: 'source', severity: 'error' },
        ]);
    });
});
