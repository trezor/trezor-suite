import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
} from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type CardanoDelegatedOutsideBannerProps = {
    accountKey: AccountKey;
};

export const CardanoDelegatedOutsideBanner = ({
    accountKey,
}: CardanoDelegatedOutsideBannerProps) => {
    const isDelegatedOutside = useSelector((state: StakingRootState) =>
        selectIsStakingAccountDelegatedOutside(state, accountKey),
    );
    const hasOutdatedProvider = useSelector((state: StakingRootState) =>
        selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );

    // An outdated provider has its own banner.
    if (!isDelegatedOutside || hasOutdatedProvider) {
        return null;
    }

    return (
        <BannerFull
            testID="@staking/cardano-delegated-outside-banner"
            intent="neutral"
            iconName="puzzlePiece"
            title={
                <Translation id="earn.stakingManagementScreen.cardanoDelegatedOutsideBanner.title" />
            }
            description={
                <Translation id="earn.stakingManagementScreen.cardanoDelegatedOutsideBanner.description" />
            }
        />
    );
};
