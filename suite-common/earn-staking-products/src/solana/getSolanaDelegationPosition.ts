import {
    type GetPositionParams,
    type SolanaStakeAccountStatus,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
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
import { getStakingPositionStatus } from '../shared/getStakingPositionStatus';
import { isPositiveStakingAmount, sumStakingAmounts } from '../shared/stakingAmounts';

export type GetSolanaDelegationPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    provider: StakingProvider;
    ownsVoteAccount: (voteAccount: string | null) => boolean;
};

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

const isSolanaStakeTransaction = ({ solanaSpecific }: StakingTransaction) =>
    solanaSpecific?.stakeOperation !== undefined;

export const getSolanaDelegationPosition = ({
    descriptor,
    provider,
    account,
    productInfo,
    transactions,
    ownsVoteAccount,
}: GetSolanaDelegationPositionParams): StakingPosition | null => {
    const stakeAccounts = parseSolanaStakeAccounts(account).filter(({ voteAccount }) =>
        ownsVoteAccount(voteAccount),
    );

    if (stakeAccounts.length === 0) return null;

    const getStake = (...statuses: SolanaStakeAccountStatus[]) =>
        sumStakingAmounts(
            stakeAccounts
                .filter(({ status }) => statuses.includes(status))
                .map(({ stake }) => stake),
        );

    const balances: StakingPositionBalances = {
        staked: getStake('active'),
        pending: getStake('activating'),
        // An inactive stake was deactivated in the epoch it was delegated and becomes
        // withdrawable at the next epoch, as a deactivating one does.
        unstaking: getStake('deactivating', 'inactive'),
        withdrawable: getStake('deactivated'),
        rewards: getSolanaExpectedEpochReward({
            yieldBearingStake: getStake('active', 'deactivating'),
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
    const pendingTxids =
        descriptor.operations.length === 0
            ? []
            : transactions
                  .filter(
                      transaction =>
                          isPendingStakingTransaction(transaction) &&
                          isSolanaStakeTransaction(transaction),
                  )
                  .map(({ txid }) => txid);

    const details: StakingPositionDetails = {
        kind: 'solana-stake-accounts',
        epoch: account.misc?.solEpoch ?? null,
        stakeAccounts: stakeAccounts.map(({ status, stake, activationEpoch }) => ({
            status,
            stake,
            activationEpoch,
        })),
    };

    return {
        productId: descriptor.id,
        status: getStakingPositionStatus({ balances }),
        lockup: 'locked',
        balances,
        unlocks,
        targets,
        operations,
        pendingTxids,
        warnings: [],
        details,
    };
};
