import { type Account } from '@suite-common/wallet-types';

import { useSolanaRewardsHistory } from './useSolanaRewardsHistory';

interface UseSolStakingRewardsWarningOptions {
    limit?: number;
}

export function useSolStakingRewardsWarning(
    account: Account,
    { limit = 1 }: UseSolStakingRewardsWarningOptions = {},
): { shouldShowWarning: boolean } {
    const result = useSolanaRewardsHistory(account, { limit, offset: 0 });

    return {
        shouldShowWarning: result.isSuccess && result.data.notAvailableYet,
    };
}
