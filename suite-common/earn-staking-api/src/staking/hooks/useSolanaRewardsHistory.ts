import { commonQueryKeys, keepPreviousData, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type SolRewardsHistory } from '../../api/types';
import { getSolanaRewardsHistory } from '../services';

const isInt = (value: unknown): value is number => Number.isInteger(value);

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

    const currentActiveEpoch = account.misc?.solEpoch;
    const latestRewardEpoch = rewards[0]?.epoch;

    if (!isInt(currentActiveEpoch) || !isInt(latestRewardEpoch)) {
        return false;
    }

    const missingRewardEpochs = currentActiveEpoch - 1 - latestRewardEpoch;

    return missingRewardEpochs > 1;
}

interface UseSolanaRewardsProps {
    limit: number;
    offset: number;
    onTotalCount: (totalCount: number) => void;

    /**
     * Triggered when the rewards history is out of sync with the current active epoch. I.e. the API returns stale data and there's an error to investigate.
     */
    onOutOfSync?: () => void;
}

export function useSolanaRewardsHistory(
    account: Account,
    { limit, offset, onTotalCount, onOutOfSync }: UseSolanaRewardsProps,
) {
    return useQuery({
        enabled: account.symbol === 'sol',
        queryKey: commonQueryKeys.solanaRewards(account.descriptor, offset, limit),
        queryFn: async () => {
            const { rewards, totalCount } = await getSolanaRewardsHistory({
                routeParams: { address: account.descriptor },
                params: { limit, offset },
            });

            onTotalCount(totalCount);

            const outOfSync = rewardsOutOfSync(account, rewards);

            if (outOfSync) onOutOfSync?.();

            return {
                rewards,
                notAvailableYet: rewardsNotAvailableYet(account, rewards),
                outOfSync,
            };
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export type SolanaRewardsHistory = ReturnType<typeof useSolanaRewardsHistory>;
