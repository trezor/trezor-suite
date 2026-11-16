import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    selectDeviceStakingEntryByWarning,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount } from '@suite-common/earn-staking-common';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export const FiveBinariesHomeBanner = () => {
    const entry = useSelector((state: StakingDeviceRootState) =>
        selectDeviceStakingEntryByWarning(state, 'outdated-provider'),
    );

    if (entry === null || !new BigNumber(getStakingPositionAmount(entry.position)).gt(0)) {
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
