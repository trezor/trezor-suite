import { useMemo } from 'react';

import { SolanaStakeAccountReward } from '@suite-common/wallet-api';
import { StakeState } from '@trezor/blockchain-link-types/src/solana';
import { isInt } from '@trezor/utils';

import { Account } from 'src/types/wallet';

export function useRewardsNotAvailableYet(
    account: Account,
    latestReward?: SolanaStakeAccountReward,
): boolean {
    if (account.networkType !== 'solana') {
        throw new Error('useRewardsNotAvailableYet can be used only with solana account');
    }

    const currentEpoch = account.misc?.solEpoch ?? null;
    const latestRewardEpoch = latestReward?.epoch ?? null;
    const hasActiveStakingAccount = useMemo(
        () =>
            (account.misc?.solStakingAccounts ?? []).some(
                stakingAccount => stakingAccount.status === StakeState.Active,
            ),
        [account.misc?.solStakingAccounts],
    );

    if (!isInt(currentEpoch) || !isInt(latestRewardEpoch) || !hasActiveStakingAccount) {
        return false;
    }

    return currentEpoch - 1 !== latestRewardEpoch;
}
