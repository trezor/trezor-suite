import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { ESHOP_STORE_URL, withGetTrezorCtaUtm } from '@trezor/urls';

import { useOpenLink } from './useOpenLink';

export const useGetTrezorEshopCta = (origin: 'dashboard' | 'settings') => {
    const openLink = useOpenLink();
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(() => {
        analytics.report({
            type: events.promoNoDeviceEshopCtaEvent.name,
            payload: { origin, platform: 'mobile', action: 'cta' },
        });
        openLink(withGetTrezorCtaUtm(ESHOP_STORE_URL, origin));
    }, [analytics, openLink, origin]);
};
