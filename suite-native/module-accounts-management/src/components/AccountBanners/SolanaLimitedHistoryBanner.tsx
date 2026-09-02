import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { BannerFull } from '@suite-native/atoms';
import {
    selectIsSolanaLimitedHistoryBannerClosed,
    setIsSolanaLimitedHistoryBannerClosed,
} from '@suite-native/banners';
import { useTranslate } from '@suite-native/intl';

export const SolanaLimitedHistoryBanner = () => {
    const { translate } = useTranslate();

    const isClosed = useSelector(selectIsSolanaLimitedHistoryBannerClosed);

    const dispatch = useDispatch();
    const handleClose = () => {
        dispatch(setIsSolanaLimitedHistoryBannerClosed());
    };

    if (isClosed) {
        return null;
    }

    return (
        <BannerFull
            marginHorizontal="sp16"
            title={translate('banner.solanaLimitedHistoryBanner.title')}
            description={translate('banner.solanaLimitedHistoryBanner.description')}
            iconName="warningCircle"
            primaryButtonLabel={translate('banner.solanaLimitedHistoryBanner.confirmButton')}
            onPressPrimaryButton={handleClose}
            intent="info"
        />
    );
};
