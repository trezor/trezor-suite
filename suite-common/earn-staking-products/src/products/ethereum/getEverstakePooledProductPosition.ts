import { z } from 'zod';

import {
    type GetPositionParams,
    type StakingAccount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProductId,
    type StakingTransaction,
    isPendingStakingTransaction,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { everstakeProvider } from '../../providers/everstake';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../utils/stakingAmounts';

// The selectors of the pool contract's stake, unstake and claimWithdrawRequest
// calls, as Blockbook parses them; the EVM kit owns the calldata itself.
const EVERSTAKE_OPERATIONS_BY_METHOD_ID: Partial<Record<string, StakingOperation>> = {
    '0x3a29dbae': 'stake',
    '0x76ec871c': 'unstake',
    '0x33986ffa': 'withdraw',
};

const getPendingEverstakeTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] =>
    transactions.filter(isPendingStakingTransaction).flatMap(({ txid, ethereumSpecific }) => {
        const methodId = ethereumSpecific?.parsedData?.methodId?.toLowerCase() ?? '';
        const operation = EVERSTAKE_OPERATIONS_BY_METHOD_ID[methodId];

        return operation === undefined ? [] : [{ txid, operation }];
    });

const everstakePoolSchema = z.object({
    name: z.string().min(1),
    autocompoundBalance: stakingAmountSchema,
    pendingBalance: stakingAmountSchema,
    pendingDepositedBalance: stakingAmountSchema,
    withdrawTotalAmount: stakingAmountSchema,
    claimableAmount: stakingAmountSchema,
    restakedReward: stakingAmountSchema,
});

type EverstakePool = z.infer<typeof everstakePoolSchema>;

const findEverstakePool = (account: StakingAccount): EverstakePool | undefined => {
    const pool = account.misc?.stakingPools?.find(({ name }) =>
        everstakeProvider.identities[account.symbol]?.includes(name),
    );
    const parsedPool = everstakePoolSchema.safeParse(pool);

    return parsedPool.success ? parsedPool.data : undefined;
};

const EMPTY_BALANCES: StakingPositionBalances = {
    staked: ZERO_STAKING_AMOUNT,
    pending: ZERO_STAKING_AMOUNT,
    unstaking: ZERO_STAKING_AMOUNT,
    withdrawable: ZERO_STAKING_AMOUNT,
    rewards: ZERO_STAKING_AMOUNT,
};

const getEverstakePoolBalances = (pool: EverstakePool): StakingPositionBalances => {
    const isWithdrawRequestFilled =
        new BigNumber(pool.claimableAmount).gt(0) &&
        new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount);

    return {
        staked: pool.autocompoundBalance,
        pending: toStakingAmount(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance),
        ),
        unstaking: isWithdrawRequestFilled ? ZERO_STAKING_AMOUNT : pool.withdrawTotalAmount,
        withdrawable: isWithdrawRequestFilled ? pool.claimableAmount : ZERO_STAKING_AMOUNT,
        rewards: pool.restakedReward,
    };
};

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
    const pool = findEverstakePool(account);

    const pendingTransactions = getPendingEverstakeTransactions(transactions);

    const isOperationPending = (operation: StakingOperation) =>
        pendingTransactions.some(transaction => transaction.operation === operation);

    if (pool === undefined && !isOperationPending('stake')) return null;

    const balances = pool === undefined ? EMPTY_BALANCES : getEverstakePoolBalances(pool);

    const balanceStatus = getStakingPositionStatus({ balances });
    const status =
        balanceStatus === 'inactive' && isOperationPending('stake') ? 'activating' : balanceStatus;

    const operations: StakingOperation[] = ['stake'];

    if (isPositiveStakingAmount(balances.staked) && pendingTransactions.length === 0) {
        operations.push('unstake');
    }

    if (isPositiveStakingAmount(balances.withdrawable) && !isOperationPending('withdraw')) {
        operations.push('withdraw');
    }

    const unlocks: StakingPositionUnlock[] = isPositiveStakingAmount(balances.unstaking)
        ? [{ amount: balances.unstaking, availableAt: null }]
        : [];

    const targets: StakingPositionTarget[] =
        pool !== undefined && isPositiveStakingAmount(balances.staked)
            ? [
                  {
                      address: poolAddress,
                      providerId: everstakeProvider.id,
                      name: pool.name,
                      amount: balances.staked,
                  },
              ]
            : [];

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
    };
};
