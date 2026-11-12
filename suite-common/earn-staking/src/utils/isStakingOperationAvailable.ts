import type { StakingOperation, StakingPosition } from '@suite-common/earn-staking-common';

import type { ResolvedStakingProductAccess } from '../state/stakingAccessSelectors';

export type IsStakingOperationAvailableParams = {
    position: StakingPosition | null;
    access: ResolvedStakingProductAccess;
    operation: StakingOperation;
};

export const isStakingOperationAvailable = ({
    position,
    access,
    operation,
}: IsStakingOperationAvailableParams): boolean =>
    position !== null &&
    position.operations.includes(operation) &&
    access.operations.includes(operation);
