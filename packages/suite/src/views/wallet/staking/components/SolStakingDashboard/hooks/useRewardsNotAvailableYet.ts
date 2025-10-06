import { StakeAccountRewards } from '@suite-common/wallet-core';
import { isInt } from '@trezor/utils';

import { Account } from 'src/types/wallet';

export function useRewardsNotAvailableYet(
    account: Account,
    latestReward?: StakeAccountRewards,
): boolean {
    if (account.networkType !== 'solana') {
        return false;
    }

    const currentEpoch = account.misc?.solEpoch ?? null;
    const latestRewardEpoch = latestReward?.epoch ?? null;

    if (!isInt(currentEpoch) || !isInt(latestRewardEpoch)) {
        return false;
    }

    return currentEpoch - 1 !== latestRewardEpoch;
}
