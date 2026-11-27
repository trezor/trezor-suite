import { type PropsWithChildren, useEffect, useRef } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { selectRouterApp } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@trezor/dependency-injection';
import { getOnboardingStepIndex, useOnboarding, useSelector } from '@trezor/suite';

export const OnboardingStepAnalytics = ({ children }: PropsWithChildren) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const { activeStepId, isActive } = useOnboarding();
    const routerApp = useSelector(selectRouterApp);
    const lastViewedStep = useRef<typeof activeStepId | null>(null);

    useEffect(() => {
        if (!isActive) {
            lastViewedStep.current = null;

            return;
        }
        if (routerApp !== 'onboarding' || lastViewedStep.current === activeStepId) return;

        lastViewedStep.current = activeStepId;
        analytics.report({
            type: events.onboardingStepViewedEvent.name,
            payload: {
                stepName: activeStepId,
                stepIndex: getOnboardingStepIndex(activeStepId),
                platform: 'desktop',
            },
        });
    }, [activeStepId, analytics, isActive, routerApp]);

    return children;
};
