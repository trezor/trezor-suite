import { AnimatePresence, motion } from 'framer-motion';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { Feature, selectFeaturesConfig } from '@suite-common/message-system';
import { type Feature as MessageFeature } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { BannerCarousel, type CarouselBanner } from './BannerCarousel';
import { type DashboardBannerType, isDashboardBannerType } from './dashboardBannerTypes';
import { DASHBOARD_BANNERS } from './dashboardBanners';
import { bannerAnimationConfig } from '../banner-animations';

const isCarouselBannerKey = (key: string): key is DashboardBannerType => isDashboardBannerType(key);

export const DashboardPromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const isDiscoveryEmpty = discoveryStatus?.type === 'discovery-empty';
    const flags = useSelector(selectFlags);
    const selectedDevice = useSelector(selectSelectedDevice);

    const allPromoBanners = useSelector(state =>
        selectFeaturesConfig(state, Feature.banners.dashboard.promo),
    );

    const deduplicatedBanners = allPromoBanners
        .map(message => message?.feature?.[0])
        .reduce<MessageFeature[]>((acc, feature) => {
            const isAlreadyPresent = acc?.some(
                previousFeature => previousFeature?.visibleBanner === feature?.visibleBanner,
            );

            if (feature?.visibleBanner && !isAlreadyPresent) {
                return [...acc, feature];
            }

            return acc;
        }, []);

    const eligibilityContext = { selectedDevice };

    const eligibleBannerTypes = deduplicatedBanners.reduce<DashboardBannerType[]>(
        (acc, feature) => {
            const visibleBanner = feature?.visibleBanner;

            if (
                !isDashboardBannerType(visibleBanner) ||
                visibleBanner === null ||
                feature?.flag !== true ||
                acc.includes(visibleBanner)
            ) {
                return acc;
            }

            const banner = DASHBOARD_BANNERS[visibleBanner];
            const isEligible =
                flags[banner.flag] && (banner.isEligible?.(eligibilityContext) ?? true);

            return isEligible ? [...acc, visibleBanner] : acc;
        },
        [],
    );

    const handleBannerClose = (key: string) => {
        if (!isCarouselBannerKey(key)) return;

        analytics.report({
            type: events.promoDashboardBannerEvent.name,
            payload: {
                action: 'close',
                bannerType: key,
            },
        });

        dispatch(setFlag({ key: DASHBOARD_BANNERS[key].flag, value: false }));
    };

    const handleBannerCTAClick = (key: string) => {
        if (!isCarouselBannerKey(key)) return;

        analytics.report({
            type: events.promoDashboardBannerEvent.name,
            payload: {
                action: 'cta',
                bannerType: key,
            },
        });
    };

    const carouselBanners: CarouselBanner[] = eligibleBannerTypes.map(bannerType => ({
        key: bannerType,
        render: handlers => DASHBOARD_BANNERS[bannerType].render(handlers),
    }));

    const shouldRender = !isDiscoveryEmpty && carouselBanners.length > 0;

    return (
        <AnimatePresence>
            {shouldRender && (
                <motion.div key="dashboard-promo-banner" {...bannerAnimationConfig}>
                    <BannerCarousel
                        banners={carouselBanners}
                        onClose={handleBannerClose}
                        onCTAClick={handleBannerCTAClick}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
