import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { FullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectFirstCardanoAccountStakedWithFiveBinaries } from '@suite-native/staking';

export const FiveBinariesHomeBanner = () => {
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    if (!account) return null;

    return (
        <FullAlertBox
            intent="info"
            title={<Translation id="earn.infoBanner.cardanoNoLongerEarningTitle" />}
            description={<Translation id="earn.infoBanner.cardanoNoLongerEarningDescription" />}
        />
    );
};
