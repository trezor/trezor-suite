import type { StakingOperation, StakingPosition } from '@suite-common/earn-staking-common';

import type { ResolvedStakingProductAccess } from '../state/stakingAccessSelectors';

export const STAKING_OPERATION_AVAILABILITIES = ['available', 'withheld', 'unavailable'] as const;

/**
 * `available`: the position offers the operation and access allows it. `withheld`: the position
 * offers it but access disables it, so the UI keeps the control with the reason. `unavailable`:
 * nothing to show.
 */
export type StakingOperationAvailability = (typeof STAKING_OPERATION_AVAILABILITIES)[number];

export type GetStakingOperationAvailabilityParams = {
    position: StakingPosition | null;
    access: ResolvedStakingProductAccess;
    operation: StakingOperation;
};

export const getStakingOperationAvailability = ({
    position,
    access,
    operation,
}: GetStakingOperationAvailabilityParams): StakingOperationAvailability => {
    if (!position?.operations.includes(operation)) {
        return 'unavailable';
    }

    if (access.operations.includes(operation)) {
        return 'available';
    }

    return access.disabled[operation] === undefined ? 'unavailable' : 'withheld';
};
