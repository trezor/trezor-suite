import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';

import { isStakingOperationAvailable } from './isStakingOperationAvailable';
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

describe('isStakingOperationAvailable', () => {
    it('is true when the position offers the operation and access allows it', () => {
        expect(
            isStakingOperationAvailable({ position, access: manage, operation: 'unstake' }),
        ).toBe(true);
    });

    it('is false when access withholds the operation', () => {
        expect(
            isStakingOperationAvailable({ position, access: manage, operation: 'withdraw' }),
        ).toBe(false);
        expect(
            isStakingOperationAvailable({ position, access: readOnly, operation: 'stake' }),
        ).toBe(false);
    });

    it('is false when the position does not offer the operation', () => {
        const unstaked = mockStakingPosition({ operations: ['stake'] });

        expect(
            isStakingOperationAvailable({
                position: unstaked,
                access: manage,
                operation: 'unstake',
            }),
        ).toBe(false);
    });

    it('is false without a position', () => {
        expect(
            isStakingOperationAvailable({ position: null, access: manage, operation: 'stake' }),
        ).toBe(false);
    });
});
