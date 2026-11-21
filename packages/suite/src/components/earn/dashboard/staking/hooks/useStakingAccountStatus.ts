import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingAccountDelegatedOutside,
    selectStakeableStakingProductDescriptorBySymbol,
    selectStakingAccountPositionDetails,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

export type StakingAccountStatus =
    | 'insufficient-funds'
    | 'staking-active'
    | 'staking-inactive'
    | 'staking-max'
    | 'staked-but-insufficient-funds'
    | 'staking-outdated-provider'
    | 'staking-remaining-votes';

export const useStakingAccountStatus = (account: Account): StakingAccountStatus => {
    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, account.key));

    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );
    const isDelegatedOutside = useSelector(state =>
        selectIsStakingAccountDelegatedOutside(state, account.key),
    );
    // A liquid position stakes the whole balance, so there is nothing more to stake.
    const isLiquidPosition = useSelector(
        state =>
            selectStakingAccountPositionEntry(state, account.key)?.position.lockup === 'liquid',
    );

    const unallocatedVotingPower = useSelector(
        state =>
            selectStakingAccountPositionDetails(state, account.key, 'tron-staking')
                ?.unallocatedVotingPower ?? null,
    );

    const minStakeAmountForDashboard = useSelector(
        state =>
            selectStakeableStakingProductDescriptorBySymbol(state, account.symbol)?.limits
                .minStakeAmountForDashboard ?? null,
    );

    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    if ((hasOutdatedProvider || isDelegatedOutside) && isNewProviderBannerEnabled) {
        return 'staking-outdated-provider';
    }

    // The active flag is the account menu's reading, so a rewards-only Tron account is staked here too.
    if (
        isStakingActive &&
        unallocatedVotingPower !== null &&
        isPositiveBalance(unallocatedVotingPower)
    ) {
        return 'staking-remaining-votes';
    }

    if (isStakingActive && (!isPositiveBalance(account.availableBalance) || isLiquidPosition)) {
        return 'staking-max';
    }

    const hasEnoughBalanceForStaking =
        minStakeAmountForDashboard !== null &&
        new BigNumber(account.availableBalance).gte(minStakeAmountForDashboard);

    if (isStakingActive) {
        return hasEnoughBalanceForStaking ? 'staking-active' : 'staked-but-insufficient-funds';
    }

    return hasEnoughBalanceForStaking ? 'staking-inactive' : 'insufficient-funds';
};
