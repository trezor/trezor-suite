import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type CardanoDelegatedOutsideBannerProps = {
    accountKey: AccountKey;
};

export const CardanoDelegatedOutsideBanner = ({
    accountKey,
}: CardanoDelegatedOutsideBannerProps) => {
    const isStakedOutsideEverstake = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );
    const isStakedWithFiveBinaries = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    if (!isStakedOutsideEverstake || isStakedWithFiveBinaries) {
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
