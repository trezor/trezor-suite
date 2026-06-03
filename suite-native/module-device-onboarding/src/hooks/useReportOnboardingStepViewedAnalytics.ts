import { useCallback, useRef } from 'react';

import { type DeviceOnboardingStepName, events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type DeviceOnboardingStackRoutes } from '@suite-native/navigation';

import {
    getDeviceOnboardingAnalyticsStepIndex,
    screenToAnalyticsStepMap,
} from '../onboardingAnalyticsSteps';

export const useReportOnboardingStepViewedAnalytics = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const lastReportedStep = useRef<DeviceOnboardingStepName | null>(null);

    return useCallback(
        (routeName: DeviceOnboardingStackRoutes) => {
            const stepName = screenToAnalyticsStepMap[routeName];

            if (!stepName || stepName === lastReportedStep.current) {
                return;
            }

            lastReportedStep.current = stepName;

            analytics.report({
                type: events.onboardingStepViewedEvent.name,
                payload: {
                    stepName,
                    stepIndex: getDeviceOnboardingAnalyticsStepIndex(stepName),
                    platform: 'mobile',
                },
            });
        },
        [analytics],
    );
};
