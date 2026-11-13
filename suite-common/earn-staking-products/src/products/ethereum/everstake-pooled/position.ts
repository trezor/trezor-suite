import {
    type GetPositionParams,
    type StakingPosition,
    type StakingProductId,
} from '@suite-common/earn-staking-common';

import {
    findEverstakePoolByAccount,
    getEverstakePendingTransactions,
    getEverstakePoolBalances,
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
    const unlocks = getPositionUnlocks({ balances });
    const targets = getPositionTargets({ pool, poolAddress, balances });

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
