import { useDispatch } from 'react-redux';

import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useGetTrezorEshopCta } from '@suite-native/link';

import { setIsGetTrezorBannerClosed } from '../bannerFlagsSlice';
import { Banner } from './Banner';
import { TS7_PROMO_BANNER_IMAGE } from '../imageSources';

export const NoDevicePromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const handleGetTrezor = useGetTrezorEshopCta('dashboard'); // should be this reported?

    const handleClose = () => {
        analytics.report({
            // should be this reported?
            type: commonAnalyticsEvents.promoNoDeviceEshopCtaEvent.name,
            payload: { origin: 'dashboard', platform: 'mobile', action: 'close' },
        });
        dispatch(setIsGetTrezorBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.trezorSafe7PromoBanner.title" />}
            ctaText={<Translation id="banner.trezorSafe7PromoBanner.button" />}
            imageSource={TS7_PROMO_BANNER_IMAGE}
            ctaIcon="arrowLineUpRight"
            onPress={handleGetTrezor}
            onClose={handleClose}
            testID="@home/get-trezor-cta"
        />
    );
};
