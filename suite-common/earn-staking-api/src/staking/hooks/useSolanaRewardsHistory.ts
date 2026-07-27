import { captureException, withScope } from '@sentry/core';

import { commonQueryKeys, keepPreviousData, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type SolRewardsHistory } from '../../api/types';
import { EARN_API_BASE_URL } from '../../constants';
import { getSolanaRewardsHistory } from '../services';

const isInt = (value: unknown): value is number => Number.isInteger(value);

function reportSolanaRewardsOutOfSync(account: Account) {
    withScope(scope => {
        scope.setTag('error.code', 'solana_rewards_history_out_of_sync');
        scope.setTag('error.source', EARN_API_BASE_URL);
        scope.setTag('error.network', account.networkType);
        scope.setTag('error.service', 'rewards_history');
        captureException(
            new Error(
                'Solana rewards history is out of sync with the current active epoch. Everstake API might return stale data.',
            ),
        );
    });
}

function rewardsNotAvailableYet(account: Account, rewards: SolRewardsHistory['rewards']) {
    if (account.networkType !== 'solana') {
        return false;
    }

    const currentActiveEpoch = account.misc?.solEpoch;
    const latestRewardEpoch = rewards[0]?.epoch;
    const hasActiveStakingAccount = (account.misc?.solStakingAccounts ?? []).some(
        stakingAccount => stakingAccount.status === 'active',
    );

    if (!isInt(currentActiveEpoch) || !isInt(latestRewardEpoch) || !hasActiveStakingAccount) {
        return false;
    }

    return currentActiveEpoch - 1 !== latestRewardEpoch;
}

/**
 * Sometimes the API that provides the rewards history is out of sync with the current active epoch. This function detects this situation.
 */
function rewardsOutOfSync(account: Account, rewards: SolRewardsHistory['rewards']) {
    if (account.networkType !== 'solana') {
        return false;
    }

    const activeEpoch = account.misc?.solEpoch;

    const latestRewardEpoch = rewards[0]?.epoch;
    const latestRewardTime = rewards[0]?.time;

    if (!isInt(activeEpoch) || !isInt(latestRewardEpoch) || !latestRewardTime) {
        return false;
    }

    const sinceLatestRewardInHours = (Date.now() - Date.parse(latestRewardTime)) / 1000 / 60 / 60;
    const epochDurationLimitInHours = 52; // 2 days + 4h

    const epochsSinceLatestReward = activeEpoch - latestRewardEpoch;

    return sinceLatestRewardInHours > epochDurationLimitInHours || epochsSinceLatestReward > 2;
}

interface UseSolanaRewardsProps {
    limit: number;
    offset: number;
}

export function useSolanaRewardsHistory(
    account: Account,
    { limit, offset }: UseSolanaRewardsProps,
) {
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.descriptor (+ offset/limit); the queryFn only additionally reads account.misc/symbol to derive staleness & telemetry flags, which intentionally must not widen the key
    return useQuery({
        enabled: account.symbol === 'sol',
        queryKey: commonQueryKeys.solanaRewards(account.descriptor, offset, limit),
        queryFn: async () => {
            const { rewards, totalCount } = await getSolanaRewardsHistory({
                routeParams: { address: account.descriptor },
                params: { limit, offset },
            });

            const notAvailableYet = offset === 0 && rewardsNotAvailableYet(account, rewards);
            const outOfSync = offset === 0 && rewardsOutOfSync(account, rewards);

            if (outOfSync) reportSolanaRewardsOutOfSync(account);

            return {
                rewards,
                totalCount,
                notAvailableYet,
                outOfSync,
            };
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export type SolanaRewardsHistory = ReturnType<typeof useSolanaRewardsHistory>;
