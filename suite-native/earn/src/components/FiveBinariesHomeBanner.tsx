import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    selectDeviceStakingEntryByWarning,
} from '@suite-common/earn-staking';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const FiveBinariesHomeBanner = () => {
    const entry = useSelector((state: StakingDeviceRootState) =>
        selectDeviceStakingEntryByWarning(state, 'outdated-provider'),
    );

    if (entry === null) {
        return null;
    }

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
