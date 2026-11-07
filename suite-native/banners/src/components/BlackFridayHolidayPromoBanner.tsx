import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { type BlackFridayHolidayBannerType } from '@suite-common/suite-constants';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { DASHBOARD_BANNER_HOLIDAY_DEALS_URL, withHolidayDealsUtm } from '@trezor/urls';

import { setHolidayPromoBannerClosed } from '../bannerFlagsSlice';
import { HOLIDAY_PROMO_BANNER_IMAGES } from '../imageSources';
import { Banner } from './Banner';

const titleKeys: Record<BlackFridayHolidayBannerType, TxKeyPath> = {
    'bfh26-ts7-accessory-pack': 'banner.blackFridayHolidayPromoBanner.ts7AccessoryPack',
    'bfh26-keep-metal': 'banner.blackFridayHolidayPromoBanner.keepMetal',
    'bfh26-ts3-gift': 'banner.blackFridayHolidayPromoBanner.ts3Gift',
    'bfh26-ts3-backup': 'banner.blackFridayHolidayPromoBanner.ts3Backup',
    'bfh26-ts7-complete-kit': 'banner.blackFridayHolidayPromoBanner.ts7CompleteKit',
    'bfh26-egift-card': 'banner.blackFridayHolidayPromoBanner.egiftCard',
    'bfh26-ts7-upgrade': 'banner.blackFridayHolidayPromoBanner.ts7Upgrade',
};

type BlackFridayHolidayPromoBannerProps = {
    bannerType: BlackFridayHolidayBannerType;
};

export const BlackFridayHolidayPromoBanner = ({
    bannerType,
}: BlackFridayHolidayPromoBannerProps) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const openLink = useOpenLink();

    const handlePress = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'cta', bannerType },
        });
        openLink(withHolidayDealsUtm(DASHBOARD_BANNER_HOLIDAY_DEALS_URL, bannerType));
    };

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'close', bannerType },
        });
        dispatch(setHolidayPromoBannerClosed(bannerType));
    };

    return (
        <Banner
            title={<Translation id={titleKeys[bannerType]} />}
            ctaText={<Translation id="banner.blackFridayHolidayPromoBanner.button" />}
            imageSource={HOLIDAY_PROMO_BANNER_IMAGES[bannerType]}
            onPress={handlePress}
            onClose={handleClose}
            testID={`@home/${bannerType}`}
        />
    );
};
