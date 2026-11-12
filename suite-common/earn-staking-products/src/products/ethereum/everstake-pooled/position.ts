import {
    type GetPositionParams,
    type StakingPosition,
    type StakingProductId,
} from '@suite-common/earn-staking-common';

import {
    findEverstakePoolByAccount,
    getEverstakePendingTransactions,
    getEverstakePoolBalances,
    getLatestEverstakeOperationTime,
    getPeriodEnd,
    getPositionActivations,
    getPositionOperations,
    getPositionStatus,
    getPositionTargets,
    getPositionUnlocks,
    isStakingOperationPending,
} from './utils';

export type GetEthereumEverstakePooledPositionParams = GetPositionParams & {
    productId: StakingProductId;
    poolAddress: string;
};

export const getEthereumEverstakePooledProductPosition = ({
    productId,
    poolAddress,
    account,
    productInfo,
    transactions,
}: GetEthereumEverstakePooledPositionParams): StakingPosition | null => {
    const pool = findEverstakePoolByAccount(account);
    const pendingTransactions = getEverstakePendingTransactions(transactions);

    const isStakePending = isStakingOperationPending({ operation: 'stake', pendingTransactions });

    if (pool === undefined && !isStakePending) {
        return null;
    }

    const balances = getEverstakePoolBalances({ pool });
    const status = getPositionStatus({ balances, isStakePending });

    const operations = getPositionOperations({ balances, pendingTransactions });

    // Each period starts at the latest mined transaction of its operation, as legacy estimated.
    const activations = getPositionActivations({
        balances,
        availableAt: getPeriodEnd({
            startedAt: getLatestEverstakeOperationTime({ operation: 'stake', transactions }),
            periodDays: productInfo?.entryPeriodDays ?? null,
        }),
    });
    const unlocks = getPositionUnlocks({
        balances,
        availableAt: getPeriodEnd({
            startedAt: getLatestEverstakeOperationTime({ operation: 'unstake', transactions }),
            periodDays: productInfo?.exitPeriodDays ?? null,
        }),
    });

    const targets = getPositionTargets({ pool, poolAddress, balances });

    return {
        productId,
        status,
        lockup: 'locked',
        balances,
        activations,
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details: null,
        revalidateAt: null,
    };
};
