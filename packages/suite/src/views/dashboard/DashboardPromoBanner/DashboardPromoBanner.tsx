import { useDispatch } from 'react-redux';

import { AnimatePresence, motion } from 'framer-motion';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { Feature, selectFeaturesConfig } from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import { type Feature as MessageFeature } from '@suite-common/suite-types';

import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { BannerCarousel, type CarouselBanner } from './BannerCarousel';
import { DashboardPromoBannerSkeleton } from './DashboardPromoBannerSkeleton';
import { type DashboardBannerType, isDashboardBannerType } from './dashboardBannerTypes';
import { DASHBOARD_BANNERS } from './dashboardBanners';
import { selectShouldShowOnboardingFeedbackBanner } from '../OnboardingFeedbackBanner/onboardingFeedbackBannerSelectors';
import { bannerAnimationConfig } from '../banner-animations';

const isCarouselBannerKey = (key: string): key is DashboardBannerType => isDashboardBannerType(key);

export const DashboardPromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const isDiscoveryEmpty = discoveryStatus?.type === 'discovery-empty';
    const flags = useSelector(selectFlags);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isOnboardingFeedbackBannerShown = useSelector(selectShouldShowOnboardingFeedbackBanner);

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

    const isDiscoveryLoading = discoveryStatus?.status === 'loading';
    const hasEligibleBanner = carouselBanners.length > 0;

    // While assets are loading we don't yet know whether the onboarding feedback banner will take
    // over the slot, so we reserve it with a skeleton instead of committing to a promo banner. This
    // prevents a flash where e.g. the TS7 banner briefly shows and is replaced by the onboarding
    // feedback banner once the discovery finishes.
    const shouldRenderSkeleton = !isDiscoveryEmpty && hasEligibleBanner && isDiscoveryLoading;

    // The onboarding feedback banner takes precedence over the promo banner.
    const shouldRenderBanner =
        !isDiscoveryEmpty &&
        !isOnboardingFeedbackBannerShown &&
        hasEligibleBanner &&
        !isDiscoveryLoading;

    return (
        <AnimatePresence>
            {shouldRenderSkeleton && (
                <motion.div key="dashboard-promo-banner-skeleton" {...bannerAnimationConfig}>
                    <DashboardPromoBannerSkeleton />
                </motion.div>
            )}
            {shouldRenderBanner && (
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
