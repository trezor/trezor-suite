import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { BannerFull } from '@suite-native/atoms';
import {
    selectIsStellarLimitedHistoryBannerClosed,
    setIsStellarLimitedHistoryBannerClosed,
} from '@suite-native/banners';
import { useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';

export const StellarLimitedHistoryBanner = () => {
    const { translate } = useTranslate();

    const isClosed = useSelector(selectIsStellarLimitedHistoryBannerClosed);

    const { dispatch } = useServices(injectDispatch);
    const handleClose = () => {
        dispatch(setIsStellarLimitedHistoryBannerClosed());
    };

    if (isClosed) {
        return null;
    }

    return (
        <BannerFull
            marginHorizontal="sp16"
            title={translate('banner.stellarLimitedHistoryBanner.title')}
            description={translate('banner.stellarLimitedHistoryBanner.description')}
            iconName="warningCircle"
            primaryButtonLabel={translate('banner.stellarLimitedHistoryBanner.confirmButton')}
            onPressPrimaryButton={handleClose}
            intent="info"
        />
    );
};
