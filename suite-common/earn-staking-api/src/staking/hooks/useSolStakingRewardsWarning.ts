import { type Account } from '@suite-common/wallet-types';

import { reportSolanaRewardsOutOfSync } from '../reportSolanaRewardsOutOfSync';
import { useSolanaRewardsHistory } from './useSolanaRewardsHistory';

export function useSolStakingRewardsWarning(account: Account): { shouldShowWarning: boolean } {
    const result = useSolanaRewardsHistory(account, {
        limit: 1,
        offset: 0,
        onOutOfSync: () => reportSolanaRewardsOutOfSync(account),
    });

    return {
        shouldShowWarning: result.isSuccess && result.data.notAvailableYet,
    };
}
