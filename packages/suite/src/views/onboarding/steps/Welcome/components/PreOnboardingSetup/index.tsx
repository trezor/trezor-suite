import React from 'react';
import { useOnboarding, useSelector } from '@suite-hooks';
import DataAnalytics from './DataAnalytics';
import SecurityCheck from './SecurityCheck';

const PreOnboardingSetup = () => {
    const { activeSubStep } = useOnboarding();
    const { analyticsConfirmed } = useSelector(state => ({
        analyticsConfirmed: state.analytics.confirmed,
    }));

    if (activeSubStep === 'security-check' || analyticsConfirmed) {
        // If user already confirmed his choice about analytics and just came to setup new device or reload the page we don't won't ask to about data collection/analytics again.
        // And only show this 2nd substep
        return <SecurityCheck />;
    }

    // 1st substep
    return <DataAnalytics />;
};

export default PreOnboardingSetup;
