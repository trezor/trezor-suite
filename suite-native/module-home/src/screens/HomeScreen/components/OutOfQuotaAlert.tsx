import React from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { noQuotaLeftWarningDismissed } from '@suite-common/suite-sync-quota-manager';
import { AnimatedBannerFull } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';

export const OutOfQuotaAlert = () => {
    const dispatch = useDispatch();
    const openLink = useOpenLink();
    const { translate } = useTranslate();

    const device = useSelector(selectSelectedDevice);

    if (!device?.id) return null;
    const deviceId = device.id;

    const handleDismiss = () => {
        dispatch(noQuotaLeftWarningDismissed({ deviceId }));
    };

    const handleContactSupport = () => {
        openLink(SUITE_MOBILE_SUPPORT_URL);
    };

    return (
        <AnimatedBannerFull
            marginHorizontal="sp16"
            intent="info"
            iconName="info"
            title={<Translation id="generic.banners.outOfSuiteSyncQuota.title" />}
            description={<Translation id="generic.banners.outOfSuiteSyncQuota.subtitle" />}
            primaryButtonLabel={translate('generic.banners.outOfSuiteSyncQuota.cta')}
            onPressPrimaryButton={handleContactSupport}
            secondaryButtonLabel={translate('generic.banners.outOfSuiteSyncQuota.dismiss')}
            onPressSecondaryButton={handleDismiss}
        />
    );
};
