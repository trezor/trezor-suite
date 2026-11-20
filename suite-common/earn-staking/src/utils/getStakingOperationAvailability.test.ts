import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';

import { getStakingOperationAvailability } from './getStakingOperationAvailability';
import type { ResolvedStakingProductAccess } from '../state/stakingAccessSelectors';

const manage: ResolvedStakingProductAccess = {
    access: 'manage',
    operations: ['stake', 'unstake'],
    disabled: { withdraw: { kind: 'message-system', feature: 'eth.staking.claim' } },
};

const readOnly: ResolvedStakingProductAccess = {
    access: 'read-only',
    operations: [],
    disabled: {},
};

const position = mockStakingPosition({ operations: ['stake', 'unstake', 'withdraw'] });

describe('getStakingOperationAvailability', () => {
    it('is available when the position offers the operation and access allows it', () => {
        expect(
            getStakingOperationAvailability({ position, access: manage, operation: 'unstake' }),
        ).toBe('available');
    });

    it('is withheld when the position offers the operation and access disables it', () => {
        expect(
            getStakingOperationAvailability({ position, access: manage, operation: 'withdraw' }),
        ).toBe('withheld');
    });

    it('is unavailable on a platform that does not manage the product', () => {
        expect(
            getStakingOperationAvailability({ position, access: readOnly, operation: 'stake' }),
        ).toBe('unavailable');
    });

    it('is unavailable when the position does not offer the operation', () => {
        const unstaked = mockStakingPosition({ operations: ['stake'] });

        expect(
            getStakingOperationAvailability({
                position: unstaked,
                access: manage,
                operation: 'unstake',
            }),
        ).toBe('unavailable');
    });

    it('is unavailable without a position', () => {
        expect(
            getStakingOperationAvailability({ position: null, access: manage, operation: 'stake' }),
        ).toBe('unavailable');
    });
});
