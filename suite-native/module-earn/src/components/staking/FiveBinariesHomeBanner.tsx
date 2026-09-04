import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    selectFirstCardanoAccountStakedWithFiveBinaries,
} from '@suite-common/wallet-core';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const FiveBinariesHomeBanner = () => {
    const account = useSelector((state: StakeRootState) =>
        selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    if (!account) return null;

    return (
        <BannerFull
            intent="warning"
            title={<Translation id="earn.stakingManagementScreen.cardanoNotEarningBanner.title" />}
            description={
                <Translation id="earn.stakingManagementScreen.cardanoNotEarningBanner.description" />
            }
        />
    );
};
