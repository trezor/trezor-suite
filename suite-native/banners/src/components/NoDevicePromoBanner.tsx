import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useGetTrezorEshopCta } from '@suite-native/link';

import { setIsGetTrezorBannerClosed } from '../bannerFlagsSlice';
import { Banner } from './Banner';
import { TS7_PROMO_BANNER_IMAGE } from '../imageSources';

export const NoDevicePromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const handleGetTrezor = useGetTrezorEshopCta('dashboard');

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'dashboard', platform: 'mobile', action: 'close' },
        });
        dispatch(setIsGetTrezorBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="moduleHome.emptyState.getTrezorCta.title" />}
            ctaText={<Translation id="moduleHome.emptyState.getTrezorCta.button" />}
            imageSource={TS7_PROMO_BANNER_IMAGE}
            ctaIcon="arrowLineUpRight"
            onPress={handleGetTrezor}
            onClose={handleClose}
            testID="@home/get-trezor-cta"
        />
    );
};
