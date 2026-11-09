import {
    type StakingAccount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { EVERSTAKE_OPERATIONS_BY_METHOD_ID } from './constants';
import { type EverstakePool, everstakePoolSchema } from './everstakePooledProductSchemas';
import { everstakeProvider } from '../../providers/everstake';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../utils/stakingAmounts';

export const findEverstakePoolByAccount = (account: StakingAccount): EverstakePool | undefined => {
    const pool = account.misc?.stakingPools?.find(({ name }) =>
        everstakeProvider.identities[account.symbol]?.includes(name),
    );

    const parsedPool = everstakePoolSchema.safeParse(pool);

    return parsedPool.success ? parsedPool.data : undefined;
};

export const getEverstakePendingTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] => {
    const pendingStakingTransactions = transactions.filter(isPendingStakingTransaction);

    return pendingStakingTransactions.flatMap(({ txid, ethereumSpecific }) => {
        const methodId = ethereumSpecific?.parsedData?.methodId?.toLowerCase() ?? '';
        const operation = EVERSTAKE_OPERATIONS_BY_METHOD_ID[methodId];

        if (operation === undefined) return [];

        return [{ txid, operation }];
    });
};

type GetEverstakePoolBalancesParams = {
    pool?: EverstakePool | undefined;
};

export const getEverstakePoolBalances = ({
    pool,
}: GetEverstakePoolBalancesParams): StakingPositionBalances => {
    if (!pool) {
        return {
            staked: ZERO_STAKING_AMOUNT,
            pending: ZERO_STAKING_AMOUNT,
            unstaking: ZERO_STAKING_AMOUNT,
            withdrawable: ZERO_STAKING_AMOUNT,
            rewards: ZERO_STAKING_AMOUNT,
        };
    }

    const isWithdrawRequestFilled =
        new BigNumber(pool.claimableAmount).gt(0) &&
        new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount);

    const staked = pool.autocompoundBalance;
    const rewards = pool.restakedReward;

    const unstaking = isWithdrawRequestFilled ? ZERO_STAKING_AMOUNT : pool.withdrawTotalAmount;
    const withdrawable = isWithdrawRequestFilled ? pool.claimableAmount : ZERO_STAKING_AMOUNT;

    const pending = toStakingAmount(
        new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance),
    );

    return { staked, pending, unstaking, withdrawable, rewards };
};

type IsStakingOperationPendingParams = {
    operation: StakingOperation;
    pendingTransactions: StakingPositionPendingTransaction[];
};

export const isStakingOperationPending = ({
    operation,
    pendingTransactions,
}: IsStakingOperationPendingParams) =>
    pendingTransactions.some(transaction => transaction.operation === operation);

type GetEverstakePositionStatusParams = {
    balances: StakingPositionBalances;
    isStakePending: boolean;
};

export const getEverstakePositionStatus = ({
    balances,
    isStakePending,
}: GetEverstakePositionStatusParams): StakingPosition['status'] => {
    const positionStatus = getStakingPositionStatus({ balances });

    if (positionStatus === 'inactive' && isStakePending) {
        return 'activating';
    }

    return positionStatus;
};

type GetEverstakePooledProductOperationsParams = {
    balances: StakingPositionBalances;
    pendingTransactions: StakingPositionPendingTransaction[];
};

export const getEverstakePositionOperations = ({
    balances,
    pendingTransactions,
}: GetEverstakePooledProductOperationsParams): StakingOperation[] => {
    const operations: StakingOperation[] = ['stake'];

    if (isPositiveStakingAmount(balances.staked) && pendingTransactions.length === 0) {
        operations.push('unstake');
    }

    if (
        isPositiveStakingAmount(balances.withdrawable) &&
        !isStakingOperationPending({ operation: 'withdraw', pendingTransactions })
    ) {
        operations.push('withdraw');
    }

    return operations;
};

type GetEverstakePositionTargetsParams = {
    pool?: EverstakePool;
    poolAddress: string;
    balances: StakingPositionBalances;
};

export const getEverstakePositionTargets = ({
    pool,
    poolAddress,
    balances,
}: GetEverstakePositionTargetsParams): StakingPositionTarget[] => {
    if (pool === undefined) {
        return [];
    }

    if (!isPositiveStakingAmount(balances.staked)) {
        return [];
    }

    const target: StakingPositionTarget = {
        address: poolAddress,
        providerId: everstakeProvider.id,
        name: pool.name,
        amount: balances.staked,
    };

    return [target];
};

type GetEverstakePositionUnlocksParams = {
    balances: StakingPositionBalances;
};

export const getEverstakePositionUnlocks = ({
    balances,
}: GetEverstakePositionUnlocksParams): StakingPositionUnlock[] => {
    if (!isPositiveStakingAmount(balances.unstaking)) {
        return [];
    }

    const unlock: StakingPositionUnlock = {
        amount: balances.unstaking,
        availableAt: null,
    };

    return [unlock];
};
