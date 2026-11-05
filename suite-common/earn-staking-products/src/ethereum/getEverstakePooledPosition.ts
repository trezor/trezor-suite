import {
    type GetPositionParams,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProductId,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { everstakeProvider } from '../providers/everstake';
import { getStakingPositionStatus } from '../shared/getStakingPositionStatus';
import { isPositiveStakingAmount, toStakingAmount } from '../shared/stakingAmounts';

// The selectors of the pool contract's stake, unstake and claimWithdrawRequest
// calls, as Blockbook parses them; the EVM kit owns the calldata itself.
const EVERSTAKE_METHOD_IDS = ['0x3a29dbae', '0x76ec871c', '0x33986ffa'];

const isEverstakeStakingTransaction = ({ ethereumSpecific }: StakingTransaction) =>
    EVERSTAKE_METHOD_IDS.includes(ethereumSpecific?.parsedData?.methodId.toLowerCase() ?? '');

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

    const status = getStakingPositionStatus({ balances });

    const operations: StakingOperation[] = ['stake'];

    const canUnstake = isPositiveStakingAmount(balances.staked);

    if (canUnstake) operations.push('unstake');

    const canWithdraw =
        isPositiveStakingAmount(balances.withdrawable) &&
        new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount);

    if (canWithdraw) operations.push('withdraw');

    const unlocks: StakingPositionUnlock[] = isPositiveStakingAmount(balances.unstaking)
        ? [{ amount: balances.unstaking, availableAt: null }]
        : [];

    const targets: StakingPositionTarget[] = isPositiveStakingAmount(balances.staked)
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
        details: null,
    };
};
