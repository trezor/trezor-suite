import {
    type GetPositionParams,
    type StakingPosition,
    type StakingProductId,
} from '@suite-common/earn-staking-common';

import {
    findEverstakePoolByAccount,
    getEverstakePendingTransactions,
    getEverstakePoolBalances,
    getEverstakePositionOperations,
    getEverstakePositionStatus,
    getEverstakePositionTargets,
    getEverstakePositionUnlocks,
    isStakingOperationPending,
} from './utils';

export type GetEverstakePooledPositionParams = GetPositionParams & {
    productId: StakingProductId;
    poolAddress: string;
};

export const getEverstakePooledProductPosition = ({
    productId,
    poolAddress,
    account,
    transactions,
}: GetEverstakePooledPositionParams): StakingPosition | null => {
    const pool = findEverstakePoolByAccount(account);
    const pendingTransactions = getEverstakePendingTransactions(transactions);

    const isStakePending = isStakingOperationPending({ operation: 'stake', pendingTransactions });

    if (pool === undefined && !isStakePending) {
        return null;
    }

    const balances = getEverstakePoolBalances({ pool });
    const status = getEverstakePositionStatus({ balances, isStakePending });

    const operations = getEverstakePositionOperations({ balances, pendingTransactions });
    const unlocks = getEverstakePositionUnlocks({ balances });
    const targets = getEverstakePositionTargets({ pool, poolAddress, balances });

    return {
        productId,
        status,
        lockup: 'locked',
        balances,
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details: null,
        revalidateAt: null,
    };
};
