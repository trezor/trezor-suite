import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    useSelector,
} from '@suite-native/staking';

type CardanoDelegatedOutsideBannerProps = {
    accountKey: AccountKey;
};

export const CardanoDelegatedOutsideBanner = ({
    accountKey,
}: CardanoDelegatedOutsideBannerProps) => {
    const isStakedOutsideEverstake = useSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );
    const isStakedWithFiveBinaries = useSelector(state =>
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
