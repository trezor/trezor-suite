import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectFirstCardanoAccountStakedWithFiveBinaries } from '@suite-native/staking';

export const FiveBinariesHomeBanner = () => {
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
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
