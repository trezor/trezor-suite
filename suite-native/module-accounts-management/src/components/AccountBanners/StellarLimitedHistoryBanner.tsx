import { useDispatch, useSelector } from 'react-redux';

import { FullAlertBox } from '@suite-native/atoms';
import {
    selectIsStellarLimitedHistoryBannerClosed,
    setStellarLimitedHistoryBannerClosed,
} from '@suite-native/banner-flags';
import { useTranslate } from '@suite-native/intl';

export const StellarLimitedHistoryBanner = () => {
    const { translate } = useTranslate();

    const isClosed = useSelector(selectIsStellarLimitedHistoryBannerClosed);

    const dispatch = useDispatch();
    const handleClose = () => {
        dispatch(setStellarLimitedHistoryBannerClosed());
    };

    if (isClosed) {
        return null;
    }

    return (
        <FullAlertBox
            marginHorizontal="sp16"
            title={translate('banner.stellarLimitedHistoryBanner.title')}
            description={translate('banner.stellarLimitedHistoryBanner.description')}
            iconName="warningCircle"
            primaryButtonLabel={translate('banner.stellarLimitedHistoryBanner.confirmButton')}
            onPressPrimaryButton={handleClose}
            variant="info"
        />
    );
};
