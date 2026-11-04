import {
    type GetPositionParams,
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProductId,
    type StakingTransaction,
    isPendingStakingTransaction,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { everstakeProvider } from '../providers/everstake';

// The selectors of the pool contract's stake, unstake and claimWithdrawRequest
// calls, as Blockbook parses them; the EVM kit owns the calldata itself.
const EVERSTAKE_METHOD_IDS = ['0x3a29dbae', '0x76ec871c', '0x33986ffa'];

const isEverstakeStakingTransaction = ({ ethereumSpecific }: StakingTransaction) =>
    EVERSTAKE_METHOD_IDS.includes(ethereumSpecific?.parsedData?.methodId.toLowerCase() ?? '');

const toStakingAmount = (value: string | BigNumber): StakingAmount =>
    stakingAmountSchema.parse(new BigNumber(value).toFixed(0));

const isPositive = (amount: StakingAmount) => new BigNumber(amount).gt(0);

type GetPositionStatusParams = {
    balances: StakingPosition['balances'];
};

const getPositionStatus = ({ balances }: GetPositionStatusParams): StakingPosition['status'] => {
    if (isPositive(balances.staked)) return 'active';
    if (isPositive(balances.pending)) return 'activating';
    if (isPositive(balances.unstaking) || isPositive(balances.withdrawable)) return 'deactivating';

    return 'inactive';
};

export type GetEverstakePooledPositionParams = GetPositionParams & {
    productId: StakingProductId;
};

export const getEverstakePooledPosition = ({
    productId,
    account,
    transactions,
}: GetEverstakePooledPositionParams): StakingPosition | null => {
    const pool = account.misc?.stakingPools?.find(({ name }) =>
        everstakeProvider.identities[account.symbol]?.includes(name),
    );

    if (pool === undefined) return null;

    const balances: StakingPosition['balances'] = {
        staked: toStakingAmount(pool.autocompoundBalance),
        pending: toStakingAmount(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance),
        ),
        unstaking: toStakingAmount(
            BigNumber.max(new BigNumber(pool.withdrawTotalAmount).minus(pool.claimableAmount), 0),
        ),
        withdrawable: toStakingAmount(pool.claimableAmount),
        rewards: toStakingAmount(pool.restakedReward),
    };

    const status = getPositionStatus({ balances });

    const operations: StakingOperation[] = ['stake'];

    const canUnstake = isPositive(balances.staked);

    if (canUnstake) operations.push('unstake');

    const canWithdraw =
        isPositive(balances.withdrawable) &&
        new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount);

    if (canWithdraw) operations.push('withdraw');

    const unlocks: StakingPositionUnlock[] = isPositive(balances.unstaking)
        ? [{ amount: balances.unstaking, availableAt: null }]
        : [];

    const targets: StakingPositionTarget[] = isPositive(balances.staked)
        ? [
              {
                  address: pool.contract,
                  providerId: everstakeProvider.id,
                  name: pool.name,
                  amount: balances.staked,
              },
          ]
        : [];

    const pendingTxids: string[] = transactions
        .filter(
            transaction =>
                isPendingStakingTransaction(transaction) &&
                isEverstakeStakingTransaction(transaction),
        )
        .map(({ txid }) => txid);

    return {
        productId,
        status,
        lockup: 'locked',
        balances,
        unlocks,
        targets,
        operations,
        pendingTxids,
        warnings: [],
    };
};
