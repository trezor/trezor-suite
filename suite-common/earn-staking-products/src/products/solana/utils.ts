import {
    type StakingAccount,
    type StakingAmount,
    type StakingOperation,
    type StakingPositionBalances,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProvider,
    type StakingTransaction,
    isPendingStakingTransaction,
    solanaStakeAccountStatusSchema,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { SOLANA_EPOCH_DAYS, SOLANA_STAKING_OPERATIONS_BY_STAKE_TYPE } from './constants';
import { type ParsedSolanaStakeAccount } from './types';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    sumStakingAmounts,
    toStakingAmount,
} from '../../utils/stakingAmounts';

export type GetSolanaExpectedEpochRewardParams = {
    yieldBearingStake: StakingAmount;
    rate: number | null;
};

// The legacy calculateSolanaStakingReward in lamports: the dashboards show the reward
// expected for the current epoch, since real rewards compound into the stake accounts.
export const getSolanaExpectedEpochReward = ({
    yieldBearingStake,
    rate,
}: GetSolanaExpectedEpochRewardParams): StakingAmount => {
    if (rate === null) {
        return ZERO_STAKING_AMOUNT;
    }

    const DAYS_IN_YEAR = 365;

    return toStakingAmount(
        new BigNumber(yieldBearingStake)
            .multipliedBy(rate)
            .dividedBy(100)
            .dividedBy(DAYS_IN_YEAR)
            .multipliedBy(SOLANA_EPOCH_DAYS),
    );
};

// Blockchain-link splits the stake accounts by the Everstake vote accounts; products regroup both
// lists by their own providers. An entry with an unknown status, stake or rent reserve is left out
// so the rest of the account still syncs.
export const parseSolanaStakeAccounts = (
    account: StakingAccount,
): readonly ParsedSolanaStakeAccount[] =>
    [
        ...(account.misc?.solStakingAccounts ?? []),
        ...(account.misc?.solExternalStakingAccounts ?? []),
    ].flatMap(({ status, stake, rentExemptReserve, voterPubkey, activationEpoch }) => {
        const parsedStatus = solanaStakeAccountStatusSchema.safeParse(status);
        const parsedStake = stakingAmountSchema.safeParse(stake ?? '0');
        const parsedRentExemptReserve = stakingAmountSchema.safeParse(rentExemptReserve ?? '0');

        if (!parsedStatus.success || !parsedStake.success || !parsedRentExemptReserve.success) {
            return [];
        }

        return [
            {
                status: parsedStatus.data,
                stake: parsedStake.data,
                rentExemptReserve: parsedRentExemptReserve.data,
                voteAccount: voterPubkey ?? null,
                activationEpoch: activationEpoch ?? null,
            },
        ];
    });

type SolanaStakeBalance = Exclude<keyof StakingPositionBalances, 'rewards'>;

type GetStakeBalanceParams = {
    stakeAccount: ParsedSolanaStakeAccount;
    epoch: number | null;
};

const getStakeBalance = ({ stakeAccount, epoch }: GetStakeBalanceParams): SolanaStakeBalance => {
    const { status, activationEpoch } = stakeAccount;

    switch (status) {
        case 'active':
            return 'staked';
        case 'activating':
            return 'pending';
        case 'deactivating':
            return 'unstaking';
        case 'deactivated':
            return 'withdrawable';
        case 'inactive':
            // The runtime reports a fresh delegation as inactive while its activation epoch is
            // ahead of the epoch it read, which blockchain-link caches for an hour. Any other
            // inactive stake was deactivated in the epoch it was delegated and becomes
            // withdrawable at the next epoch, as a deactivating one does.
            return activationEpoch !== null && epoch !== null && activationEpoch > epoch
                ? 'pending'
                : 'unstaking';
        default:
            return exhaustive(status);
    }
};

type GetPositionBalancesParams = {
    stakeAccounts: ParsedSolanaStakeAccount[];
    rate: number | null | undefined;
    epoch: number | null;
};

export const getPositionBalances = ({
    stakeAccounts,
    rate,
    epoch,
}: GetPositionBalancesParams): StakingPositionBalances => {
    const getStake = (...balances: SolanaStakeBalance[]) =>
        sumStakingAmounts(
            stakeAccounts
                .filter(stakeAccount => balances.includes(getStakeBalance({ stakeAccount, epoch })))
                .map(({ stake }) => stake),
        );

    const staked = getStake('staked');
    const pending = getStake('pending');
    const unstaking = getStake('unstaking');
    const withdrawable = getStake('withdrawable');

    const rewards = getSolanaExpectedEpochReward({
        yieldBearingStake: sumStakingAmounts(
            stakeAccounts
                .filter(({ status }) => status === 'active' || status === 'deactivating')
                .map(({ stake }) => stake),
        ),
        rate: rate ?? null,
    });

    return { staked, pending, unstaking, withdrawable, rewards };
};

type IsPositionOperationAvailableParams = {
    operation: StakingOperation;
    balances: StakingPositionBalances;
};

const isPositionOperationAvailable = ({
    operation,
    balances,
}: IsPositionOperationAvailableParams): boolean => {
    switch (operation) {
        case 'stake':
            return true;
        case 'unstake':
            return isPositiveStakingAmount(balances.staked);
        case 'withdraw':
            return isPositiveStakingAmount(balances.withdrawable);
        case 'claim':
        case 'vote':
        case 'redelegate':
            return false;
        default:
            return exhaustive(operation);
    }
};

type GetPositionOperationsParams = {
    operations: readonly StakingOperation[];
    balances: StakingPositionBalances;
};

export const getPositionOperations = ({
    operations,
    balances,
}: GetPositionOperationsParams): StakingOperation[] =>
    operations.filter(operation => isPositionOperationAvailable({ operation, balances }));

type GetPositionUnlocksParams = {
    balances: StakingPositionBalances;
};

export const getPositionUnlocks = ({
    balances,
}: GetPositionUnlocksParams): StakingPositionUnlock[] => {
    if (!isPositiveStakingAmount(balances.unstaking)) {
        return [];
    }

    const unlock: StakingPositionUnlock = {
        amount: balances.unstaking,
        availableAt: null,
    };

    return [unlock];
};

type GetPositionTargetsParams = {
    stakeAccounts: readonly ParsedSolanaStakeAccount[];
    provider: StakingProvider;
};

export const getPositionTargets = ({
    stakeAccounts,
    provider,
}: GetPositionTargetsParams): StakingPositionTarget[] => {
    const activeStakesByVoteAccount = new Map<string, ParsedSolanaStakeAccount['stake'][]>();

    stakeAccounts.forEach(({ status, stake, voteAccount }) => {
        if (status !== 'active' || voteAccount === null) return;

        activeStakesByVoteAccount.set(voteAccount, [
            ...(activeStakesByVoteAccount.get(voteAccount) ?? []),
            stake,
        ]);
    });

    return Array.from(activeStakesByVoteAccount, ([address, stakes]) => ({
        address,
        providerId: provider.id,
        ...(provider.status === 'external' ? {} : { name: provider.name }),
        amount: sumStakingAmounts(stakes),
    })).filter(({ amount }) => isPositiveStakingAmount(amount));
};

type GetSolanaStakingPendingTransactionsParams = {
    transactions: readonly StakingTransaction[];
};

export const getSolanaStakingPendingTransactions = ({
    transactions,
}: GetSolanaStakingPendingTransactionsParams) => {
    const pendingStakingTransactions = transactions.filter(isPendingStakingTransaction);

    return pendingStakingTransactions.flatMap(({ txid, solanaSpecific }) => {
        const stakeType = solanaSpecific?.stakeOperation?.type;

        if (stakeType === undefined) {
            return [];
        }

        const operation = SOLANA_STAKING_OPERATIONS_BY_STAKE_TYPE[stakeType];

        if (operation === undefined) {
            return [];
        }

        return [{ txid, operation }];
    });
};
