import React, { useState } from 'react';

import { Feature, selectFeatureConfig } from '@suite-common/message-system';
import { EventType, analytics } from '@trezor/suite-analytics';

import { useSelector } from 'src/hooks/suite';

import { TrezorExpertBanner } from './TrezorExpertBanner';
import { isDashboardBannerType } from './dashboardBannerTypes';
import { selectIsTEXDashboardPromoBannerShown } from '../../../reducers/suite/suiteReducer';

export const DashboardPromoBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    const shouldShowTEXDashboardPromoBanner = useSelector(selectIsTEXDashboardPromoBannerShown);

    const promoBanner = useSelector(state =>
        selectFeatureConfig(state, Feature.dashboardPromoBanner),
    );

    const promoBannerPayload = promoBanner?.visibleBanner;
    const currentBanner = isDashboardBannerType(promoBannerPayload) ? promoBannerPayload : null;

    const onCloseBanner = () => {
        analytics.report({
            type: EventType.DashboardBanner,
            payload: {
                action: 'close',
                bannerType: currentBanner,
            },
        });
        setIsVisible(false);
    };

    const onCTAClick = () => {
        analytics.report({
            type: EventType.DashboardBanner,
            payload: {
                action: 'cta',
                bannerType: currentBanner,
            },
        });
    };

    if (!currentBanner) return null;

    return (
        <>
            {currentBanner === 'tex' && shouldShowTEXDashboardPromoBanner && (
                <TrezorExpertBanner
                    onClose={onCloseBanner}
                    onCTAClick={onCTAClick}
                    isVisible={isVisible}
                />
            )}
        </>
    );
};
