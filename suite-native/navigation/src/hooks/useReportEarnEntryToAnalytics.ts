import { useCallback, useRef } from 'react';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { EarnStackRoutes } from '../routes';
import { isEarnEntryOverlayRoute } from '../utils/earnNavigationUtils';

type EarnEntryNavigationParams = {
    currentRouteName: string | undefined;
    currentRouteKey?: string;
    previousRouteName?: string;
};

export const useReportEarnEntryToAnalytics = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const previousScreenRef = useRef<{ name: string; key?: string } | undefined>(undefined);

    return useCallback(
        ({ currentRouteName, currentRouteKey, previousRouteName }: EarnEntryNavigationParams) => {
            if (!currentRouteName || isEarnEntryOverlayRoute(currentRouteName)) return false;

            const previousScreen =
                previousScreenRef.current ??
                (previousRouteName && !isEarnEntryOverlayRoute(previousRouteName)
                    ? { name: previousRouteName, key: undefined }
                    : undefined);
            previousScreenRef.current = { name: currentRouteName, key: currentRouteKey };

            if (
                currentRouteName !== EarnStackRoutes.Earn ||
                (previousScreen?.name === currentRouteName &&
                    previousScreen.key === currentRouteKey)
            )
                return false;

            analytics.report({
                type: events.yieldEarnEntryEvent.name,
                payload: { from: previousScreen?.name ?? 'unknown' },
            });

            return true;
        },
        [analytics],
    );
};
