import {
    type StakingAccount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionActivation,
    type StakingPositionBalances,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { ETHEREUM_EVERSTAKE_OPERATIONS_BY_METHOD_ID } from './constants';
import { type EverstakePool, everstakePoolSchema } from './types';
import { everstakeProvider } from '../../../providers/everstake';
import { getStakingPositionStatus } from '../../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../../utils/stakingAmounts';

const DAY_MS = 24 * 60 * 60 * 1000;

export const findEverstakePoolByAccount = (account: StakingAccount): EverstakePool | undefined => {
    const pool = account.misc?.stakingPools?.find(({ name }) =>
        everstakeProvider.identities[account.symbol]?.includes(name),
    );

    const parsedPool = everstakePoolSchema.safeParse(pool);

    return parsedPool.success ? parsedPool.data : undefined;
};

const getEverstakeOperation = ({
    ethereumSpecific,
}: StakingTransaction): StakingOperation | undefined => {
    const methodId = ethereumSpecific?.parsedData?.methodId?.toLowerCase() ?? '';

    return ETHEREUM_EVERSTAKE_OPERATIONS_BY_METHOD_ID[methodId];
};

export const getEverstakePendingTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] => {
    const pendingStakingTransactions = transactions.filter(isPendingStakingTransaction);

    return pendingStakingTransactions.flatMap(transaction => {
        const operation = getEverstakeOperation(transaction);

        if (operation === undefined) return [];

        return [{ txid: transaction.txid, operation }];
    });
};

type GetLatestEverstakeOperationTimeParams = {
    operation: StakingOperation;
    transactions: readonly StakingTransaction[];
};

export const getLatestEverstakeOperationTime = ({
    operation,
    transactions,
}: GetLatestEverstakeOperationTimeParams): number | null => {
    const blockTimes = transactions.flatMap(transaction => {
        if (isPendingStakingTransaction(transaction)) return [];

        if (getEverstakeOperation(transaction) !== operation) return [];

        return transaction.blockTime ? [transaction.blockTime] : [];
    });

    return blockTimes.length === 0 ? null : Math.max(...blockTimes) * 1000;
};

type GetPeriodEndParams = {
    startedAt: number | null;
    periodDays: number | null;
};

export const getPeriodEnd = ({ startedAt, periodDays }: GetPeriodEndParams): number | null =>
    startedAt === null || periodDays === null ? null : startedAt + periodDays * DAY_MS;

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

type GetPositionStatusParams = {
    balances: StakingPositionBalances;
    isStakePending: boolean;
};

export const getPositionStatus = ({
    balances,
    isStakePending,
}: GetPositionStatusParams): StakingPosition['status'] => {
    const positionStatus = getStakingPositionStatus({ balances });

    if (positionStatus === 'inactive' && isStakePending) {
        return 'activating';
    }

    return positionStatus;
};

type GetPositionOperationsParams = {
    balances: StakingPositionBalances;
    pendingTransactions: StakingPositionPendingTransaction[];
};

export const getPositionOperations = ({
    balances,
    pendingTransactions,
}: GetPositionOperationsParams): StakingOperation[] => {
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

type GetPositionTargetsParams = {
    pool?: EverstakePool;
    poolAddress: string;
    balances: StakingPositionBalances;
};

export const getPositionTargets = ({
    pool,
    poolAddress,
    balances,
}: GetPositionTargetsParams): StakingPositionTarget[] => {
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

type GetPositionActivationsParams = {
    balances: StakingPositionBalances;
    availableAt: number | null;
};

export const getPositionActivations = ({
    balances,
    availableAt,
}: GetPositionActivationsParams): StakingPositionActivation[] => {
    if (!isPositiveStakingAmount(balances.pending)) {
        return [];
    }

    const activation: StakingPositionActivation = {
        amount: balances.pending,
        availableAt,
    };

    return [activation];
};

type GetPositionUnlocksParams = {
    balances: StakingPositionBalances;
    availableAt: number | null;
};

export const getPositionUnlocks = ({
    balances,
    availableAt,
}: GetPositionUnlocksParams): StakingPositionUnlock[] => {
    if (!isPositiveStakingAmount(balances.unstaking)) {
        return [];
    }

    const unlock: StakingPositionUnlock = {
        amount: balances.unstaking,
        availableAt,
    };

    return [unlock];
};
