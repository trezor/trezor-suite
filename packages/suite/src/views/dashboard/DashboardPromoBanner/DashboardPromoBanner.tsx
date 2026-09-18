import { useEffect, useMemo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasOnlyPortfolioDevice, selectSelectedDevice } from '@suite-common/device';
import {
    Feature,
    parsePromoBannerMessages,
    selectEligiblePromoBanners,
    selectFeaturesConfig,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';

import { useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { BannerCarousel, type CarouselBanner } from './BannerCarousel';
import { DashboardPromoBannerSkeleton } from './DashboardPromoBannerSkeleton';
import { type DashboardBannerType, isDashboardBannerType } from './dashboardBannerTypes';
import { DASHBOARD_BANNERS } from './dashboardBanners';
import { selectShouldShowOnboardingFeedbackBanner } from '../OnboardingFeedbackBanner/onboardingFeedbackBannerSelectors';
import { bannerAnimationConfig } from '../banner-animations';

const isCarouselBannerKey = (key: string): key is DashboardBannerType => isDashboardBannerType(key);

export const DashboardPromoBanner = () => {
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const isDiscoveryEmpty = discoveryStatus?.type === 'discovery-empty';
    const flags = useSelector(selectFlags);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isPortfolioTrackerOnly = useSelector(selectHasOnlyPortfolioDevice);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isOnboardingFeedbackBannerShown = useSelector(selectShouldShowOnboardingFeedbackBanner);

    const allPromoBanners = useSelector(state =>
        selectFeaturesConfig(state, Feature.banners.dashboard.promo),
    );

    const eligibilityContext = { selectedDevice };
    const { errors: promoBannerConfigErrors, promoBanners } = useMemo(
        () => parsePromoBannerMessages(allPromoBanners),
        [allPromoBanners],
    );
    const promoBannerConfigErrorMessage = promoBannerConfigErrors.join('\n');

    useEffect(() => {
        if (!isDevEnv || promoBannerConfigErrorMessage === '') {
            return;
        }

        console.error(promoBannerConfigErrorMessage);
    }, [promoBannerConfigErrorMessage]);

    const configEligibleBannerTypes = useMemo(
        () =>
            selectEligiblePromoBanners({
                promoBanners,
                platform: isDesktop() ? 'desktop' : 'web',
                placement: 'dashboard',
                accounts,
                isWalletDiscoveryFinished: discoveryStatus?.status !== 'loading',
                isPortfolioTrackerOnly,
                selectedDevice,
                reportError: error => {
                    if (isDevEnv) {
                        console.error(error);
                    }
                },
            }),
        [accounts, discoveryStatus?.status, isPortfolioTrackerOnly, promoBanners, selectedDevice],
    );

    const eligibleBannerTypes = configEligibleBannerTypes.filter(
        (bannerType): bannerType is DashboardBannerType => {
            if (!isDashboardBannerType(bannerType)) {
                return false;
            }

            const banner = DASHBOARD_BANNERS[bannerType];

            return flags[banner.flag] && (banner.isEligible?.(eligibilityContext) ?? true);
        },
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
