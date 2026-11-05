import {
    type GetPositionParams,
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
    type StakingPositionTarget,
    type StakingPositionWarning,
    type StakingProductDescriptor,
    type StakingProvider,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { parseCardanoStakingInfo } from './cardanoStakingInfo';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from '../../utils/stakingAmounts';

type IsOperationAvailableParams = {
    operation: StakingOperation;
    rewards: StakingAmount;
    isWithdrawalBlocked: boolean;
};

const isOperationAvailable = ({
    operation,
    rewards,
    isWithdrawalBlocked,
}: IsOperationAvailableParams): boolean => {
    switch (operation) {
        case 'stake':
            // The delegation already covers the whole balance.
            return false;
        case 'unstake':
            // Deregistration withdraws the rewards in the same transaction.
            return !isWithdrawalBlocked;
        case 'claim':
            return isPositiveStakingAmount(rewards) && !isWithdrawalBlocked;
        case 'vote':
            return true;
        case 'withdraw':
        case 'redelegate':
            return false;
        default:
            return exhaustive(operation);
    }
};

type GetPoolTargetsParams = {
    poolId: string | null;
    staked: StakingAmount;
    provider: StakingProvider;
};

const getPoolTargets = ({
    poolId,
    staked,
    provider,
}: GetPoolTargetsParams): StakingPositionTarget[] => {
    if (poolId === null || !isPositiveStakingAmount(staked)) return [];

    return [
        {
            address: poolId,
            providerId: provider.id,
            ...(provider.status === 'external' ? {} : { name: provider.name }),
            amount: staked,
        },
    ];
};

const isCardanoStakingTransaction = ({ cardanoSpecific }: StakingTransaction) =>
    cardanoSpecific?.subtype !== undefined;

export type GetCardanoDelegationProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsPool: (poolId: string | null) => boolean;
};

export const getCardanoDelegationProductPosition = ({
    descriptor,
    provider,
    account,
    transactions,
    ownsPool,
}: GetCardanoDelegationProductPositionParams): StakingPosition | null => {
    const stakingInfo = parseCardanoStakingInfo(account);

    if (stakingInfo === null || !ownsPool(stakingInfo.poolId)) return null;

    const { poolId, rewards, drep } = stakingInfo;
    const staked = toStakingAmount(account.balance);
    const isWithdrawalBlocked = isPositiveStakingAmount(rewards) && drep === null;

    const balances: StakingPositionBalances = {
        staked,
        pending: ZERO_STAKING_AMOUNT,
        unstaking: ZERO_STAKING_AMOUNT,
        withdrawable: ZERO_STAKING_AMOUNT,
        rewards,
    };

    const operations = descriptor.operations.filter(operation =>
        isOperationAvailable({ operation, rewards, isWithdrawalBlocked }),
    );

    const pendingTxids = transactions
        .filter(
            transaction =>
                isPendingStakingTransaction(transaction) &&
                isCardanoStakingTransaction(transaction),
        )
        .map(({ txid }) => txid);

    const warnings: StakingPositionWarning[] = [
        ...(provider.status === 'retired'
            ? [{ code: 'outdated-provider' as const, providerId: provider.id }]
            : []),
        ...(isWithdrawalBlocked ? [{ code: 'missing-drep' as const }] : []),
    ];

    const details: StakingPositionDetails = { kind: 'cardano-delegation', poolId, drep };

    return {
        productId: descriptor.id,
        status: getStakingPositionStatus({ balances }),
        lockup: 'liquid',
        balances,
        unlocks: [],
        targets: getPoolTargets({ poolId, staked, provider }),
        operations,
        pendingTxids,
        warnings,
        details,
    };
};
