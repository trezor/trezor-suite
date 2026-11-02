import { useSelector } from 'react-redux';

import { type StakeRootState } from '@suite-common/wallet-core';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { selectCardanoAccountForFiveBinariesBanner } from '../../earnScreenSelectors';

export const FiveBinariesHomeBanner = () => {
    const account = useSelector((state: StakeRootState) =>
        selectCardanoAccountForFiveBinariesBanner(state),
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
