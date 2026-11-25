import { type TranslationKey } from '@suite/intl';
import {
    type StakingRootState,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';

// The most pressing warning of the account's position, in the order the badge showed them.
export const selectAccountStakingBadgeWarningLabel = (
    state: StakingRootState,
    accountKey: AccountKey,
): TranslationKey | null => {
    if (selectHasStakingAccountWarning(state, accountKey, 'outdated-provider')) {
        return 'TR_STAKING_REWARDS_REDUCED';
    }

    if (selectIsStakingAccountDelegatedOutside(state, accountKey)) {
        return 'TR_STAKING_DIFFERENT_PROVIDER';
    }

    const tronStaking = selectStakingAccountPositionDetails(state, accountKey, 'tron-staking');

    if (tronStaking !== null && isPositiveBalance(tronStaking.unallocatedVotingPower)) {
        return 'TR_EARN_STAKING_DASHBOARD_REMAINING_VOTES_NO_APR';
    }

    return null;
};
