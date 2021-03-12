import React from 'react';
import { useOnboarding, useSelector } from '@suite-hooks';
import DataAnalytics from './DataAnalytics';
import SecurityCheck from './SecurityCheck';

const PreOnboardingSetup = () => {
    const { activeSubStep } = useOnboarding();
    const initialRun = useSelector(s => s.suite.flags.initialRun);

    if (activeSubStep === 'security-check' || !initialRun) {
        // If it is not an initial run of onboarding, but rather user came to setup new device we don't won't ask to about data collection/analytics again.
        // And only show this 2nd substep
        return <SecurityCheck />;
    }

    // 1st substep
    return <DataAnalytics />;
};

export default PreOnboardingSetup;
