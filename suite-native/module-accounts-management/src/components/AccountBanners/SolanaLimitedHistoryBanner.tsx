import { useDispatch, useSelector } from 'react-redux';

import { FullAlertBox } from '@suite-native/atoms';
import {
    selectIsSolanaLimitedHistoryBannerClosed,
    setSolanaLimitedHistoryBannerClosed,
} from '@suite-native/banner-flags';
import { useTranslate } from '@suite-native/intl';

export const SolanaLimitedHistoryBanner = () => {
    const { translate } = useTranslate();

    const isClosed = useSelector(selectIsSolanaLimitedHistoryBannerClosed);

    const dispatch = useDispatch();
    const handleClose = () => {
        dispatch(setSolanaLimitedHistoryBannerClosed());
    };

    if (isClosed) {
        return null;
    }

    return (
        <FullAlertBox
            marginHorizontal="sp16"
            title={translate('banner.solanaLimitedHistoryBanner.title')}
            description={translate('banner.solanaLimitedHistoryBanner.description')}
            iconName="warningCircle"
            primaryButtonLabel={translate('banner.solanaLimitedHistoryBanner.confirmButton')}
            onPressPrimaryButton={handleClose}
            variant="info"
        />
    );
};
