import {
    type GetPositionParams,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProductDescriptor,
    type StakingProvider,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import { getSolanaExpectedEpochReward } from './solanaEpochReward';
import { type ParsedSolanaStakeAccount, parseSolanaStakeAccounts } from './solanaStakeAccounts';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import { isPositiveStakingAmount, sumStakingAmounts } from '../../utils/stakingAmounts';

type IsOperationAvailableParams = {
    operation: StakingOperation;
    balances: StakingPositionBalances;
};

const isOperationAvailable = ({ operation, balances }: IsOperationAvailableParams): boolean => {
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

type StakeBalance = Exclude<keyof StakingPositionBalances, 'rewards'>;

type GetStakeBalanceParams = {
    stakeAccount: ParsedSolanaStakeAccount;
    epoch: number | null;
};

const getStakeBalance = ({ stakeAccount, epoch }: GetStakeBalanceParams): StakeBalance => {
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

type GetVoteAccountTargetsParams = {
    stakeAccounts: readonly ParsedSolanaStakeAccount[];
    provider: StakingProvider;
};

const getVoteAccountTargets = ({
    stakeAccounts,
    provider,
}: GetVoteAccountTargetsParams): StakingPositionTarget[] => {
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

type SolanaStakeType = NonNullable<
    NonNullable<StakingTransaction['solanaSpecific']>['stakeOperation']
>['type'];

const OPERATIONS_BY_SOLANA_STAKE_TYPE: Partial<Record<SolanaStakeType, StakingOperation>> = {
    stake: 'stake',
    unstake: 'unstake',
    claim: 'withdraw',
};

const getPendingSolanaStakeTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] =>
    transactions.filter(isPendingStakingTransaction).flatMap(({ txid, solanaSpecific }) => {
        const stakeType = solanaSpecific?.stakeOperation?.type;
        const operation =
            stakeType === undefined ? undefined : OPERATIONS_BY_SOLANA_STAKE_TYPE[stakeType];

        return operation === undefined ? [] : [{ txid, operation }];
    });

export type GetSolanaDelegationProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsVoteAccount: (voteAccount: string | null) => boolean;
};

export const getSolanaDelegationProductPosition = ({
    descriptor,
    provider,
    account,
    productInfo,
    transactions,
    ownsVoteAccount,
}: GetSolanaDelegationProductPositionParams): StakingPosition | null => {
    const stakeAccounts = parseSolanaStakeAccounts(account).filter(({ voteAccount }) =>
        ownsVoteAccount(voteAccount),
    );

    if (stakeAccounts.length === 0) return null;

    const epoch = account.misc?.solEpoch ?? null;

    const getStake = (...balances: StakeBalance[]) =>
        sumStakingAmounts(
            stakeAccounts
                .filter(stakeAccount => balances.includes(getStakeBalance({ stakeAccount, epoch })))
                .map(({ stake }) => stake),
        );

    const balances: StakingPositionBalances = {
        staked: getStake('staked'),
        pending: getStake('pending'),
        unstaking: getStake('unstaking'),
        withdrawable: getStake('withdrawable'),
        rewards: getSolanaExpectedEpochReward({
            yieldBearingStake: sumStakingAmounts(
                stakeAccounts
                    .filter(({ status }) => status === 'active' || status === 'deactivating')
                    .map(({ stake }) => stake),
            ),
            rate: productInfo?.rate ?? null,
        }),
    };

    const unlocks: StakingPositionUnlock[] = isPositiveStakingAmount(balances.unstaking)
        ? [{ amount: balances.unstaking, availableAt: null }]
        : [];

    const targets = getVoteAccountTargets({ stakeAccounts, provider });

    const operations = descriptor.operations.filter(operation =>
        isOperationAvailable({ operation, balances }),
    );

    // Only a product Suite operates on owns the stake operations Suite broadcasts.
    const pendingTransactions =
        descriptor.operations.length === 0 ? [] : getPendingSolanaStakeTransactions(transactions);

    const details: StakingPositionDetails = {
        kind: 'solana-stake-accounts',
        epoch,
        stakeAccounts: stakeAccounts.map(
            ({ status, stake, rentExemptReserve, activationEpoch }) => ({
                status,
                stake,
                rentExemptReserve,
                activationEpoch,
            }),
        ),
    };

    return {
        productId: descriptor.id,
        status: getStakingPositionStatus({ balances }),
        lockup: 'locked',
        balances,
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details,
    };
};
