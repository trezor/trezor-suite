import {
    type GetPositionParams,
    type StakingAccount,
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionWarning,
    type StakingProductDescriptor,
    type StakingProvider,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    isCardanoStakeKeyRegistered,
    parseCardanoAccountBalance,
    parseCardanoStakingInfo,
} from './cardanoStakingInfo';
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
    hasPendingTransaction: boolean;
};

const isOperationAvailable = ({
    operation,
    rewards,
    isWithdrawalBlocked,
    hasPendingTransaction,
}: IsOperationAvailableParams): boolean => {
    switch (operation) {
        case 'stake':
            // The delegation already covers the whole balance.
            return false;
        case 'unstake':
            // Deregistration withdraws the rewards in the same transaction.
            return !isWithdrawalBlocked && !hasPendingTransaction;
        case 'claim':
            return (
                isPositiveStakingAmount(rewards) && !isWithdrawalBlocked && !hasPendingTransaction
            );
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

type CardanoStakingSubtype = NonNullable<
    NonNullable<StakingTransaction['cardanoSpecific']>['subtype']
>;

const OPERATIONS_BY_CARDANO_SUBTYPE: Record<CardanoStakingSubtype, StakingOperation> = {
    stake_registration: 'stake',
    stake_delegation: 'stake',
    stake_deregistration: 'unstake',
    withdrawal: 'claim',
    governance_delegation: 'vote',
};

const getPendingCardanoStakingTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] =>
    transactions.filter(isPendingStakingTransaction).flatMap(({ txid, cardanoSpecific }) => {
        const subtype = cardanoSpecific?.subtype;

        return subtype === undefined
            ? []
            : [{ txid, operation: OPERATIONS_BY_CARDANO_SUBTYPE[subtype] }];
    });

type GetPendingFirstStakePositionParams = {
    descriptor: StakingProductDescriptor;
    account: StakingAccount;
    pendingTransactions: readonly StakingPositionPendingTransaction[];
};

// Suite stakes with Everstake only, so a stake key whose registration is still pending belongs to
// the Everstake product, with the balance waiting to be delegated.
const getPendingFirstStakePosition = ({
    descriptor,
    account,
    pendingTransactions,
}: GetPendingFirstStakePositionParams): StakingPosition | null => {
    const balance = parseCardanoAccountBalance(account);

    if (balance === null || !pendingTransactions.some(({ operation }) => operation === 'stake')) {
        return null;
    }

    return {
        productId: descriptor.id,
        status: 'activating',
        lockup: 'liquid',
        balances: {
            staked: ZERO_STAKING_AMOUNT,
            pending: balance,
            unstaking: ZERO_STAKING_AMOUNT,
            withdrawable: ZERO_STAKING_AMOUNT,
            rewards: ZERO_STAKING_AMOUNT,
        },
        unlocks: [],
        targets: [],
        operations: [],
        pendingTransactions,
        warnings: [],
        details: { kind: 'cardano-delegation', poolId: null, drep: null },
    };
};

export type GetCardanoDelegationProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsPool: (poolId: string | null) => boolean;
    ownsPendingFirstStake: boolean;
};

export const getCardanoDelegationProductPosition = ({
    descriptor,
    provider,
    account,
    transactions,
    ownsPool,
    ownsPendingFirstStake,
}: GetCardanoDelegationProductPositionParams): StakingPosition | null => {
    const pendingTransactions = getPendingCardanoStakingTransactions(transactions);

    if (!isCardanoStakeKeyRegistered(account)) {
        return ownsPendingFirstStake
            ? getPendingFirstStakePosition({ descriptor, account, pendingTransactions })
            : null;
    }

    const stakingInfo = parseCardanoStakingInfo(account);

    if (stakingInfo === null || !ownsPool(stakingInfo.poolId)) return null;

    const { balance, poolId, rewards, drep } = stakingInfo;
    // The account balance already holds the reward balance, so the two must not overlap.
    const staked = toStakingAmount(BigNumber.max(new BigNumber(balance).minus(rewards), 0));
    const isWithdrawalBlocked = isPositiveStakingAmount(rewards) && drep === null;

    const balances: StakingPositionBalances = {
        staked,
        pending: ZERO_STAKING_AMOUNT,
        unstaking: ZERO_STAKING_AMOUNT,
        withdrawable: ZERO_STAKING_AMOUNT,
        rewards,
    };

    const operations = descriptor.operations.filter(operation =>
        isOperationAvailable({
            operation,
            rewards,
            isWithdrawalBlocked,
            hasPendingTransaction: pendingTransactions.length > 0,
        }),
    );

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
        pendingTransactions,
        warnings,
        details,
    };
};
