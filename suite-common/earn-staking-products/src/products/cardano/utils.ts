import {
    type CardanoDrep,
    type StakingAccount,
    type StakingAmount,
    type StakingOperation,
    type StakingPositionBalances,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingProvider,
    type StakingTransaction,
    cardanoPoolIdSchema,
    isPendingStakingTransaction,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { CARDANO_STAKING_OPERATIONS_BY_CARDANO_SUBTYPE } from './constants';
import { ZERO_STAKING_AMOUNT, isPositiveStakingAmount } from '../../utils/stakingAmounts';

export const isCardanoStakeKeyRegistered = ({ misc }: StakingAccount) =>
    misc?.staking?.isActive === true;

export const getParsedCardanoAccountBalance = ({
    balance,
}: StakingAccount): StakingAmount | null => {
    const parsedBalance = stakingAmountSchema.safeParse(balance);

    return parsedBalance.success ? parsedBalance.data : null;
};

type ParsedCardanoStakingInfo = {
    balance: StakingAmount;
    poolId: string | null;
    rewards: StakingAmount;
    drep: CardanoDrep | null;
};

type GetParsedCardanoStakingInfoParams = {
    account: StakingAccount;
};

export const getParsedCardanoStakingInfo = ({
    account,
}: GetParsedCardanoStakingInfoParams): ParsedCardanoStakingInfo | null => {
    const staking = account.misc?.staking;

    if (!staking?.isActive) {
        return null;
    }

    const balance = getParsedCardanoAccountBalance(account);
    const rewards = stakingAmountSchema.safeParse(staking.rewards);

    const poolId = staking.poolId
        ? cardanoPoolIdSchema.safeParse(staking.poolId.toLowerCase())
        : null;

    if (balance === null || !rewards.success || poolId?.success === false) {
        return null;
    }

    return {
        balance,
        poolId: poolId?.data ?? null,
        rewards: rewards.data,
        drep: staking.drep?.drep_id
            ? { id: staking.drep.drep_id, hasScript: staking.drep.has_script }
            : null,
    };
};

type GetCardanoDelegationPendingTransactionsParams = {
    transactions: readonly StakingTransaction[];
};

export const getCardanoDelegationPendingTransactions = ({
    transactions,
}: GetCardanoDelegationPendingTransactionsParams): StakingPositionPendingTransaction[] => {
    const pendingStakingTransactions = transactions.filter(isPendingStakingTransaction);

    return pendingStakingTransactions.flatMap(({ txid, cardanoSpecific }) => {
        const subtype = cardanoSpecific?.subtype;

        if (subtype === undefined) {
            return [];
        }

        return [{ txid, operation: CARDANO_STAKING_OPERATIONS_BY_CARDANO_SUBTYPE[subtype] }];
    });
};

type IsCardanoDelegationPositionOperationAvailableParams = {
    operation: StakingOperation;
    rewards: StakingAmount;
    isWithdrawalBlocked: boolean;
    hasPendingTransaction: boolean;
};

const isCardanoDelegationPositionOperationAvailable = ({
    operation,
    rewards,
    isWithdrawalBlocked,
    hasPendingTransaction,
}: IsCardanoDelegationPositionOperationAvailableParams): boolean => {
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

type GetCardanoDelegationPositionOperationsParams = {
    operations: readonly StakingOperation[];
    rewards: StakingAmount;
    isWithdrawalBlocked: boolean;
    pendingTransactions: StakingPositionPendingTransaction[];
};

export const getCardanoDelegationPositionOperations = ({
    operations,
    rewards,
    isWithdrawalBlocked,
    pendingTransactions,
}: GetCardanoDelegationPositionOperationsParams): StakingOperation[] =>
    operations.filter(operation =>
        isCardanoDelegationPositionOperationAvailable({
            operation,
            rewards,
            isWithdrawalBlocked,
            hasPendingTransaction: pendingTransactions.length > 0,
        }),
    );

type GetCardanoDelegationPositionTargetsParams = {
    poolId: string | null;
    staked: StakingAmount;
    provider: StakingProvider;
};

export const getCardanoDelegationPositionTargets = ({
    poolId,
    staked,
    provider,
}: GetCardanoDelegationPositionTargetsParams): StakingPositionTarget[] => {
    if (poolId === null || !isPositiveStakingAmount(staked)) {
        return [];
    }

    const target: StakingPositionTarget = {
        address: poolId,
        providerId: provider.id,
        ...(provider.status === 'external' ? {} : { name: provider.name }),
        amount: staked,
    };

    return [target];
};

type GetCardanoDelegationPositionBalancesParams = {
    staked: StakingAmount;
    rewards: StakingAmount;
};

export const getCardanoDelegationPositionBalances = ({
    staked,
    rewards,
}: GetCardanoDelegationPositionBalancesParams): StakingPositionBalances => ({
    staked,
    pending: ZERO_STAKING_AMOUNT,
    unstaking: ZERO_STAKING_AMOUNT,
    withdrawable: ZERO_STAKING_AMOUNT,
    rewards,
});
