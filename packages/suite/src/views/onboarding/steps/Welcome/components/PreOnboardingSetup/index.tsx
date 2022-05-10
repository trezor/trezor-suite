import React from 'react';
import { useOnboarding, useSelector } from '@suite-hooks';
import DataAnalytics from './DataAnalytics';
import SecurityCheck from './SecurityCheck';

const PreOnboardingSetup = () => {
    const { activeSubStep } = useOnboarding();
    const { confirmed } = useSelector(state => ({
        confirmed: state.analytics.confirmed,
    }));

    if (activeSubStep === 'security-check' || confirmed) {
        // If user already confirmed his choice about data collection
        // and just came to setup new device or reload the page we don't won't ask to about data collection again.
        // And only show this 2nd substep
        return <SecurityCheck />;
    }

    // 1st substep
    return <DataAnalytics />;
};

export default PreOnboardingSetup;
