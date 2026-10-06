import { captureException, withScope } from '@sentry/core';

import { commonQueryKeys, keepPreviousData, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { EARN_API_BASE_URL } from '../../constants';
import { getSolanaRewardsHistory } from '../services';
import {
    type SolanaRewardsSyncStatus,
    areSolanaRewardsNotAvailableYet,
    getSolanaRewardsSyncStatus,
} from '../utils';

// The query refetches periodically and on every screen visit, so one affected account
// would keep producing identical Sentry events — report it only once per app session.
const reportedAccountDescriptors = new Set<string>();

function reportSolanaRewardsOutOfSync(account: Account, syncStatus: SolanaRewardsSyncStatus) {
    if (reportedAccountDescriptors.has(account.descriptor)) {
        return;
    }
    reportedAccountDescriptors.add(account.descriptor);

    withScope(scope => {
        scope.setTag('error.code', 'solana_rewards_history_out_of_sync');
        scope.setTag('error.source', EARN_API_BASE_URL);
        scope.setTag('error.network', account.networkType);
        scope.setTag('error.service', 'rewards_history');
        scope.setExtras({
            activeEpoch: syncStatus.activeEpoch,
            latestRewardEpoch: syncStatus.latestRewardEpoch,
            epochsSinceLatestReward: syncStatus.epochsSinceLatestReward,
            hoursSinceLatestReward: syncStatus.hoursSinceLatestReward,
            oldestActiveStakeActivationEpoch: syncStatus.oldestActiveStakeActivationEpoch,
        });
        captureException(
            new Error(
                'Solana rewards history is out of sync with the current active epoch. Everstake API might return stale data.',
            ),
        );
    });
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

            const notAvailableYet =
                offset === 0 && areSolanaRewardsNotAvailableYet(account, rewards);
            const syncStatus = getSolanaRewardsSyncStatus(account, rewards);
            const outOfSync = offset === 0 && syncStatus.isOutOfSync;

            if (outOfSync) reportSolanaRewardsOutOfSync(account, syncStatus);

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
