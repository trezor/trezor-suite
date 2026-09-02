import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DASHBOARD_BANNER_TS7_URL } from '@trezor/urls';

import { setIsTs7PromoBannerClosed } from '../bannerFlagsSlice';
import { Banner } from './Banner';
import { TS7_PROMO_BANNER_IMAGE } from '../imageSources';

export const TrezorSafe7PromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const openLink = useOpenLink();

    const handlePress = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'cta', bannerType: 'ts7' },
        });
        openLink(DASHBOARD_BANNER_TS7_URL);
    };

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'close', bannerType: 'ts7' },
        });
        dispatch(setIsTs7PromoBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.trezorSafe7PromoBanner.title" />}
            ctaText={<Translation id="banner.trezorSafe7PromoBanner.button" />}
            imageSource={TS7_PROMO_BANNER_IMAGE}
            ctaIcon="arrowLineUpRight"
            onPress={handlePress}
            onClose={handleClose}
            testID="@home/get-trezor-cta"
        />
    );
};
