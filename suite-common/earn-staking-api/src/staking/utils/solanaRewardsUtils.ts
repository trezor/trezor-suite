import { type Account } from '@suite-common/wallet-types';

import { type SolRewardsHistory } from '../../api/types';

// Everstake publishes the reward for an epoch only after the epoch ends, so the latest
// reward being one or two epochs behind the active epoch is expected; a bigger lag means
// the rewards history API is out of sync with the chain.
const MAX_TOLERATED_EPOCH_LAG = 2;

const isInt = (value: unknown): value is number => Number.isInteger(value);

export type SolanaRewardsSyncStatus = {
    isOutOfSync: boolean;
    activeEpoch?: number;
    latestRewardEpoch?: number;
    epochsSinceLatestReward?: number;
    hoursSinceLatestReward?: number;
    oldestActiveStakeActivationEpoch?: number;
};

const getActiveSolanaStakingAccounts = (account: Account) => {
    if (account.networkType !== 'solana') {
        return [];
    }

    return (account.misc?.solStakingAccounts ?? []).filter(
        stakingAccount => stakingAccount.status === 'active',
    );
};

export const hasActiveSolanaStakingAccount = (account: Account) =>
    getActiveSolanaStakingAccounts(account).length > 0;

// The oldest active stake tells us since when a reward per epoch is expected again — any
// older stake among the active ones would already earn every epoch.
const getOldestActiveStakeActivationEpoch = (account: Account) => {
    const activationEpochs = getActiveSolanaStakingAccounts(account)
        .map(stakingAccount => stakingAccount.activationEpoch)
        .filter(isInt);

    return activationEpochs.length > 0 ? Math.min(...activationEpochs) : undefined;
};

export const areSolanaRewardsNotAvailableYet = (
    account: Account,
    rewards: SolRewardsHistory['rewards'],
) => {
    if (account.networkType !== 'solana') {
        return false;
    }

    const currentActiveEpoch = account.misc?.solEpoch;
    const latestRewardEpoch = rewards[0]?.epoch;

    if (
        !isInt(currentActiveEpoch) ||
        !isInt(latestRewardEpoch) ||
        !hasActiveSolanaStakingAccount(account)
    ) {
        return false;
    }

    return currentActiveEpoch - 1 !== latestRewardEpoch;
};

/**
 * Detects whether the rewards history API lags behind the current active epoch more than
 * expected. Only accounts with an active stake are checked — after an unstake the latest
 * reward legitimately keeps getting older, which is not a sign of stale API data.
 */
export const getSolanaRewardsSyncStatus = (
    account: Account,
    rewards: SolRewardsHistory['rewards'],
): SolanaRewardsSyncStatus => {
    if (account.networkType !== 'solana') {
        return { isOutOfSync: false };
    }

    const activeEpoch = account.misc?.solEpoch;
    const latestRewardEpoch = rewards[0]?.epoch;

    if (
        !isInt(activeEpoch) ||
        !isInt(latestRewardEpoch) ||
        !hasActiveSolanaStakingAccount(account)
    ) {
        return { isOutOfSync: false };
    }

    const epochsSinceLatestReward = activeEpoch - latestRewardEpoch;

    // A stake activated in epoch N earns its first reward for epoch N + 1, so right after a
    // restake the latest reward may legitimately still come from the previous staking cycle.
    const oldestActiveStakeActivationEpoch = getOldestActiveStakeActivationEpoch(account);
    const latestExpectedRewardEpoch = isInt(oldestActiveStakeActivationEpoch)
        ? Math.max(latestRewardEpoch, oldestActiveStakeActivationEpoch + 1)
        : latestRewardEpoch;

    // The reward age is diagnostics only — a missing or invalid timestamp must not suppress
    // the epoch-based decision.
    const latestRewardTimestamp = Date.parse(rewards[0]?.time ?? '');
    const hoursSinceLatestReward = Number.isFinite(latestRewardTimestamp)
        ? Math.round((Date.now() - latestRewardTimestamp) / 1000 / 60 / 60)
        : undefined;

    return {
        isOutOfSync: activeEpoch - latestExpectedRewardEpoch > MAX_TOLERATED_EPOCH_LAG,
        activeEpoch,
        latestRewardEpoch,
        epochsSinceLatestReward,
        hoursSinceLatestReward,
        oldestActiveStakeActivationEpoch,
    };
};
