import { useState } from 'react';

import { events } from '@suite/analytics';
import {
    selectIsStablecoinYieldDashboardPromoBannerShown,
    selectIsTEXDashboardPromoBannerShown,
    selectIsTS7DashboardPromoBannerShown,
} from '@suite/flags';
import { selectSelectedDevice } from '@suite-common/device';
import { Feature, selectFeaturesConfig } from '@suite-common/message-system';
import { type Feature as MessageFeature } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { StablecoinYieldBanner } from './StablecoinYieldBanner';
import { TS7Banner } from './TS7Banner';
import { TrezorExpertBanner } from './TrezorExpertBanner';
import { type DashboardBannerTypeWithNull, isDashboardBannerType } from './dashboardBannerTypes';

export const DashboardPromoBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    const analytics = useAnalytics();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const isDiscoveryEmpty = discoveryStatus?.type === 'discovery-empty';
    const shouldShowTEXDashboardPromoBanner = useSelector(selectIsTEXDashboardPromoBannerShown);
    const shouldShowTS7DashboardPromoBanner = useSelector(selectIsTS7DashboardPromoBannerShown);
    const shouldShowStablecoinYieldDashboardPromoBanner = useSelector(
        selectIsStablecoinYieldDashboardPromoBannerShown,
    );
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

    const deviceIsNotT3W1 = getDeviceInternalModel(selectedDevice) !== DeviceModelInternal.T3W1;

    const onCloseBanner = (currentBanner: DashboardBannerTypeWithNull) => {
        analytics.report({
            type: events.promoDashboardBannerEvent.name,
            payload: {
                action: 'close',
                bannerType: currentBanner,
            },
        });

        setIsVisible(false);
    };

    const onCTAClick = (currentBanner: DashboardBannerTypeWithNull) => {
        analytics.report({
            type: events.promoDashboardBannerEvent.name,
            payload: {
                action: 'cta',
                bannerType: currentBanner,
            },
        });
    };

    const promoBanner = deduplicatedBanners.find(banner => {
        if (!banner) return null;

        const isTS7BannerVisible =
            banner.visibleBanner === 'ts7' && shouldShowTS7DashboardPromoBanner && deviceIsNotT3W1;
        const isTEXBannerVisible =
            banner.visibleBanner === 'tex' && shouldShowTEXDashboardPromoBanner;
        const isStablecoinYieldBannerVisible =
            banner.visibleBanner === 'stablecoin-yield' &&
            shouldShowStablecoinYieldDashboardPromoBanner &&
            !hasBitcoinOnlyFirmware(selectedDevice);

        return isDashboardBannerType(banner.visibleBanner) &&
            (isTS7BannerVisible || isTEXBannerVisible || isStablecoinYieldBannerVisible)
            ? banner.flag === true
            : null;
    });

    if (!promoBanner || isDiscoveryEmpty) return null;
    const { visibleBanner } = promoBanner;

    if (visibleBanner === 'ts7')
        return (
            <TS7Banner
                onClose={() => onCloseBanner(visibleBanner)}
                onCTAClick={() => onCTAClick(visibleBanner)}
                isVisible={isVisible}
                data-testid="@dashboard/promo-banner"
            />
        );

    if (visibleBanner === 'tex') {
        return (
            <TrezorExpertBanner
                onClose={() => onCloseBanner(visibleBanner)}
                onCTAClick={() => onCTAClick(visibleBanner)}
                isVisible={isVisible}
            />
        );
    }

    if (visibleBanner === 'stablecoin-yield') {
        return (
            <StablecoinYieldBanner
                onClose={() => onCloseBanner(visibleBanner)}
                onCTAClick={() => onCTAClick(visibleBanner)}
                isVisible={isVisible}
            />
        );
    }

    return null;
};
