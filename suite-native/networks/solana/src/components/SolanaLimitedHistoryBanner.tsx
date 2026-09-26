import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { BannerFull } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import {
    closeLimitedHistoryBanner,
    selectIsSolanaLimitedHistoryBannerClosed,
} from '../solanaSlice';

export const SolanaLimitedHistoryBanner = () => {
    const { translate } = useTranslate();
    const isClosed = useSelector(selectIsSolanaLimitedHistoryBannerClosed);
    const { dispatch } = useServices(injectDispatch);

    const handleClose = () => {
        dispatch(closeLimitedHistoryBanner());
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
